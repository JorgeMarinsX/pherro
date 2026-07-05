<script setup lang="ts">
import type { AttributeDefinition } from '~/types/attribute'
import type { VehicleAttributeInput, VehicleCreatePayload, VehicleDetail, VehicleFormState } from '~/types/vehicle'
import { FUEL_LABELS, TRANSMISSION_LABELS } from '~/types/vehicle'

const open = defineModel<boolean>('open', { default: false })

// Present = edit mode (prefill + "Editar anúncio"). Absent = create mode (blank + "Novo anúncio").
const props = defineProps<{ vehicle?: VehicleDetail | null }>()

const emit = defineEmits<{ submitted: [] }>()

const isEdit = computed(() => Boolean(props.vehicle?.id))
const title = computed(() => (isEdit.value ? 'Editar anúncio' : 'Novo anúncio'))

function blankState(): VehicleFormState {
  return {
    make: '',
    model: '',
    year: undefined,
    price: undefined,
    mileage: undefined,
    color: '',
    transmission: 'MANUAL',
    fuelType: 'FLEX',
    status: 'ACTIVE',
    description: '',
    photos: [],
    attributes: [],
  }
}

function fromVehicle(v: VehicleDetail): VehicleFormState {
  return {
    make: v.make,
    model: v.model,
    year: v.year,
    price: v.price,
    mileage: v.mileage,
    color: v.color,
    transmission: v.transmission,
    fuelType: v.fuelType,
    status: v.status,
    description: v.description ?? '',
    photos: [...(v.photos ?? [])]
      .sort((a, b) => a.position - b.position)
      .map(p => ({ url: p.url, thumbUrl: p.thumbUrl ?? null })),
    attributes: (v.attributes ?? []).map(a => ({
      attributeDefinitionId: a.attributeDefinition.id,
      value: a.value,
    })),
  }
}

const state = reactive<VehicleFormState>(blankState())

// Reset or prefill each time modal opens, based on passed context.
watch(open, (isOpen: boolean) => {
  if (!isOpen) return
  Object.assign(state, props.vehicle ? fromVehicle(props.vehicle) : blankState())
})

const transmissionOptions = Object.entries(TRANSMISSION_LABELS).map(([value, label]) => ({ label, value }))
const fuelOptions = Object.entries(FUEL_LABELS).map(([value, label]) => ({ label, value }))
const statusOptions = [
  { label: 'Ativo', value: 'ACTIVE' },
  { label: 'Inativo', value: 'INACTIVE' },
]

const { create, update } = useAdminVehicles()
const toast = useToast()
const planUsage = usePlanUsageStore()
const loading = ref(false)

// Attribute definitions for the attach section. Hydrate once when the modal opens.
const attrStore = useAttributesStore()
watch(open, (isOpen: boolean) => {
  if (isOpen && !attrStore.definitions.length) attrStore.fetchDefinitions()
})

const defById = computed(
  () => new Map((attrStore.definitions as AttributeDefinition[]).map(d => [d.id, d])),
)
// Only definitions not already attached can be added.
const availableDefs = computed(() =>
  (attrStore.definitions as AttributeDefinition[]).filter(
    d => !state.attributes.some((a: VehicleAttributeInput) => a.attributeDefinitionId === d.id),
  ),
)

function addAttribute(id: string) {
  const def = defById.value.get(id)
  if (!def) return
  // BOOLEAN defaults to "Sim"; ENUM to its first option; TEXT empty.
  const value = def.type === 'BOOLEAN' ? 'Sim' : def.type === 'ENUM' ? (def.options?.[0] ?? '') : ''
  state.attributes.push({ attributeDefinitionId: id, value })
}

function removeAttribute(id: string) {
  state.attributes = state.attributes.filter(
    (a: VehicleAttributeInput) => a.attributeDefinitionId !== id,
  )
}

const BOOL_OPTIONS = [{ label: 'Sim', value: 'Sim' }, { label: 'Não', value: 'Não' }]
function enumOptions(id: string) {
  return (defById.value.get(id)?.options ?? []).map((o: string) => ({ label: o, value: o }))
}

// UInput type=number can yield strings; backend @IsInt rejects "2024".
function toInt(v: number | string | undefined): number {
  return Math.trunc(Number(v))
}

// Build the payload explicitly — never spread `state` raw. forbidNonWhitelisted
// 400s on any field the DTO doesn't whitelist.
function buildPayload(): VehicleCreatePayload {
  return {
    make: state.make.trim(),
    model: state.model.trim(),
    year: toInt(state.year),
    price: toInt(state.price),
    mileage: toInt(state.mileage),
    color: state.color.trim(),
    description: state.description.trim() || null,
    transmission: state.transmission,
    fuelType: state.fuelType,
    status: state.status,
    photos: state.photos.map((p, i) => ({
      url: p.url,
      thumbUrl: p.thumbUrl ?? null,
      position: i,
    })),
    attributes: state.attributes
      .filter((a: VehicleAttributeInput) => a.value.trim())
      .map((a: VehicleAttributeInput) => ({
        attributeDefinitionId: a.attributeDefinitionId,
        value: a.value.trim(),
      })),
  }
}

// Client-side guard — avoid round-tripping obvious 400s. Returns pt-BR error or null.
function validate(): string | null {
  if (!state.make.trim()) return 'Informe a marca.'
  if (!state.model.trim()) return 'Informe o modelo.'
  if (!Number.isInteger(toInt(state.year)) || toInt(state.year) < 1900) return 'Informe um ano válido.'
  if (!Number.isFinite(Number(state.price)) || toInt(state.price) < 0) return 'Informe um preço válido.'
  if (!Number.isFinite(Number(state.mileage)) || toInt(state.mileage) < 0) return 'Informe a quilometragem.'
  return null
}

// Nest validation errors arrive as { message: string | string[] }.
function errorMessage(e: unknown): string {
  const msg = (e as { data?: { message?: string | string[] } })?.data?.message
  if (Array.isArray(msg)) return msg.join(' ')
  if (typeof msg === 'string') return msg
  return 'Não foi possível salvar o anúncio.'
}

async function onSubmit() {
  const invalid = validate()
  if (invalid) {
    toast.add({ title: invalid, color: 'error' })
    return
  }

  loading.value = true
  try {
    const payload = buildPayload()
    if (isEdit.value && props.vehicle?.id) {
      await update(props.vehicle.id, payload)
    } else {
      await create(payload)
    }
    toast.add({ title: 'Anúncio salvo', color: 'success' })
    emit('submitted')
    open.value = false
    void planUsage.fetchUsage()
  } catch (e) {
    // Quota 403 → dedicated limit dialog (with upgrade CTA) instead of a toast.
    if ((e as { statusCode?: number })?.statusCode === 403) {
      planUsage.showLimitDialog(errorMessage(e))
      void planUsage.fetchUsage()
    } else {
      toast.add({ title: errorMessage(e), color: 'error' })
    }
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <UModal
    v-model:open="open"
    :title="title"
    :ui="{ content: 'max-w-3xl' }"
  >
    <template #body>
      <UForm :state="state" class="space-y-4" @submit="onSubmit">
        <div class="grid gap-4 sm:grid-cols-2">
          <UFormField label="Marca" name="make" required>
            <UInput v-model="state.make" placeholder="Ex.: Volkswagen" class="w-full" />
          </UFormField>
          <UFormField label="Modelo" name="model" required>
            <UInput v-model="state.model" placeholder="Ex.: Nivus Highline" class="w-full" />
          </UFormField>
          <UFormField label="Ano" name="year" required>
            <UInput v-model="state.year" type="number" placeholder="2024" class="w-full" />
          </UFormField>
          <UFormField label="Cor" name="color">
            <UInput v-model="state.color" placeholder="Branco" class="w-full" />
          </UFormField>
          <UFormField label="Preço (R$)" name="price" required>
            <UInput v-model="state.price" type="number" placeholder="89900" class="w-full" />
          </UFormField>
          <UFormField label="Quilometragem" name="mileage" required>
            <UInput v-model="state.mileage" type="number" placeholder="35000" class="w-full" />
          </UFormField>
          <UFormField label="Câmbio" name="transmission" required>
            <USelect v-model="state.transmission" :items="transmissionOptions" value-key="value" class="w-full" />
          </UFormField>
          <UFormField label="Combustível" name="fuelType" required>
            <USelect v-model="state.fuelType" :items="fuelOptions" value-key="value" class="w-full" />
          </UFormField>
          <UFormField label="Status" name="status" required class="sm:col-span-2">
            <USelect v-model="state.status" :items="statusOptions" value-key="value" class="w-full" />
          </UFormField>
        </div>

        <UFormField label="Fotos" name="photos">
          <PhotoUploader v-model="state.photos" />
        </UFormField>

        <UFormField label="Descrição" name="description">
          <UTextarea v-model="state.description" :rows="5" placeholder="Detalhes do veículo..." class="w-full" />
        </UFormField>

        <UFormField label="Atributos" name="attributes">
          <div class="space-y-2">
            <div
              v-for="attr in state.attributes"
              :key="attr.attributeDefinitionId"
              class="flex items-center gap-2"
            >
              <div class="flex min-w-0 flex-1 items-center gap-2">
                <UIcon
                  :name="defById.get(attr.attributeDefinitionId)?.icon || 'i-lucide-tag'"
                  class="size-4 shrink-0 text-muted"
                />
                <span class="truncate text-sm">
                  {{ defById.get(attr.attributeDefinitionId)?.name ?? attr.attributeDefinitionId }}
                </span>
              </div>
              <USelect
                v-if="defById.get(attr.attributeDefinitionId)?.type === 'BOOLEAN'"
                v-model="attr.value"
                :items="BOOL_OPTIONS"
                value-key="value"
                class="w-40"
              />
              <USelect
                v-else-if="defById.get(attr.attributeDefinitionId)?.type === 'ENUM'"
                v-model="attr.value"
                :items="enumOptions(attr.attributeDefinitionId)"
                value-key="value"
                class="w-40"
              />
              <UInput v-else v-model="attr.value" placeholder="Valor" class="w-40" />
              <UButton
                color="error"
                variant="ghost"
                icon="i-lucide-x"
                aria-label="Remover atributo"
                @click="removeAttribute(attr.attributeDefinitionId)"
              />
            </div>

            <UDropdownMenu
              v-if="availableDefs.length"
              :items="[availableDefs.map(d => ({ label: d.name, icon: d.icon || 'i-lucide-tag', onSelect: () => addAttribute(d.id) }))]"
            >
              <UButton color="neutral" variant="outline" icon="i-lucide-plus" label="Adicionar atributo" />
            </UDropdownMenu>
            <p v-else-if="!state.attributes.length" class="text-sm text-muted">
              Nenhum atributo cadastrado. Crie atributos na página Atributos.
            </p>
          </div>
        </UFormField>

        <div class="flex items-center justify-end gap-2 pt-2">
          <UButton color="neutral" variant="ghost" label="Cancelar" :disabled="loading" @click="open = false" />
          <UButton
            type="submit"
            color="primary"
            icon="i-lucide-save"
            :loading="loading"
            :label="isEdit ? 'Salvar alterações' : 'Salvar anúncio'"
            :ui="{ base: 'text-white' }"
          />
        </div>
      </UForm>
    </template>
  </UModal>
</template>
