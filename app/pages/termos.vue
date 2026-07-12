<script setup lang="ts">
definePageMeta({ layout: false })

useSeoMeta({
  title: 'Termos de Uso — Pherro',
  description: 'Termos de Uso da plataforma Pherro.',
  robots: 'noindex',
})
</script>

<template>
  <LegalPage title="Termos de Uso" updated-at="12 de julho de 2026">
    <p>
      Estes Termos de Uso ("Termos") regulam o acesso e a utilização da plataforma
      <strong>Pherro</strong> ("Plataforma"), um serviço de criação e gestão de lojas
      virtuais para revendas de veículos. Ao criar uma conta, você ("Lojista") declara
      ter lido, compreendido e aceito integralmente estes Termos e a
      <NuxtLink to="/privacidade">Política de Privacidade</NuxtLink>.
    </p>

    <h2>1. O serviço</h2>
    <p>
      A Pherro fornece, mediante assinatura mensal, uma loja virtual com endereço próprio,
      painel administrativo para gestão de veículos, captação e gestão de leads
      (interessados), envio de e-mails e integrações de pagamento. Os recursos disponíveis
      variam conforme o plano contratado, incluindo limites de veículos anunciados, leads,
      e-mails mensais e armazenamento de fotos.
    </p>

    <h2>2. Cadastro e conta</h2>
    <ul>
      <li>O cadastro exige dados verdadeiros e atualizados, incluindo CPF ou CNPJ válido, utilizado para a emissão das cobranças.</li>
      <li>O Lojista é responsável pela guarda das credenciais de acesso e por toda atividade realizada em sua conta.</li>
      <li>É vedado o cadastro por menores de 18 anos.</li>
    </ul>

    <h2>3. Pagamento, atraso e suspensão</h2>
    <ul>
      <li>A assinatura é cobrada mensalmente por meio do provedor de pagamentos Asaas (Pix, boleto ou cartão).</li>
      <li>A loja criada por auto-cadastro só entra no ar após a confirmação do primeiro pagamento.</li>
      <li>Em caso de atraso, o Lojista é notificado por e-mail e tem um <strong>período de carência de 7 (sete) dias</strong> para regularizar o pagamento.</li>
      <li>Esgotada a carência sem pagamento, a loja e o painel administrativo são <strong>suspensos</strong>. Os dados são preservados e a loja é reativada automaticamente após a confirmação do pagamento.</li>
      <li>O cancelamento da assinatura pode ser solicitado a qualquer momento e interrompe as cobranças futuras; não há reembolso proporcional de períodos já pagos.</li>
    </ul>

    <h2>4. Responsabilidades do Lojista</h2>
    <ul>
      <li>Todo o conteúdo publicado na loja (anúncios, fotos, preços, descrições e dados de contato) é de responsabilidade exclusiva do Lojista, que garante sua veracidade e legalidade.</li>
      <li>O Lojista se obriga a não publicar conteúdo ilícito, enganoso, ofensivo ou que viole direitos de terceiros (incluindo direitos de imagem e propriedade intelectual).</li>
      <li>A negociação e a venda dos veículos ocorrem diretamente entre o Lojista e o interessado. A Pherro <strong>não participa da transação</strong>, não intermedeia pagamentos de veículos e não se responsabiliza por vícios, evicção ou inadimplemento nas negociações.</li>
      <li>No tratamento de dados pessoais dos leads captados pela loja, o Lojista atua como <strong>controlador</strong>, nos termos da Lei nº 13.709/2018 (LGPD), sendo responsável por utilizá-los apenas para atender ao contato solicitado e por respeitar os direitos dos titulares.</li>
    </ul>

    <h2>5. Responsabilidades da Pherro</h2>
    <ul>
      <li>Manter a Plataforma disponível, ressalvadas manutenções programadas e eventos fora de seu controle razoável. O serviço é fornecido "no estado em que se encontra", sem garantia de disponibilidade ininterrupta.</li>
      <li>Realizar cópias de segurança (backups) diárias dos dados da Plataforma.</li>
      <li>Atuar como <strong>operadora</strong> no tratamento dos dados pessoais dos leads, seguindo as instruções do Lojista, conforme a <NuxtLink to="/privacidade">Política de Privacidade</NuxtLink>.</li>
    </ul>

    <h2>6. Propriedade intelectual</h2>
    <p>
      A Plataforma, sua marca, código, layout e funcionalidades pertencem à Pherro.
      O conteúdo publicado pelo Lojista (fotos, textos e dados dos anúncios) permanece de
      titularidade do Lojista, que concede à Pherro licença de uso limitada à operação e
      exibição da loja.
    </p>

    <h2>7. Encerramento</h2>
    <ul>
      <li>O Lojista pode encerrar sua conta a qualquer momento, mediante solicitação pelos canais de atendimento.</li>
      <li>A Pherro pode suspender ou encerrar contas que violem estes Termos ou a legislação, mediante notificação quando cabível.</li>
      <li>Após o encerramento, os dados da loja são excluídos ou anonimizados nos prazos descritos na Política de Privacidade.</li>
    </ul>

    <h2>8. Alterações destes Termos</h2>
    <p>
      Estes Termos podem ser atualizados para refletir mudanças no serviço ou na legislação.
      Alterações relevantes serão comunicadas por e-mail com antecedência mínima de 15 (quinze)
      dias. O uso continuado da Plataforma após a vigência das alterações implica concordância.
    </p>

    <h2>9. Contato e foro</h2>
    <p>
      Dúvidas sobre estes Termos podem ser enviadas para
      <a href="mailto:contato@pherro.app">contato@pherro.app</a>.
      Estes Termos são regidos pelas leis brasileiras, ficando eleito o foro do domicílio do
      Lojista para dirimir eventuais controvérsias, quando aplicável a legislação consumerista.
    </p>
  </LegalPage>
</template>
