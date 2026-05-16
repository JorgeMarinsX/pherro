export default defineAppConfig({
  ui: {
    navigationMenu: {
      compoundVariants: [
        {
          color: 'primary',
          variant: 'pill',
          active: true,
          class: {
            link: 'text-white before:bg-primary-600 hover:before:bg-primary-500',
            linkLeadingIcon: 'text-white group-data-[state=open]:text-white',
          },
        },
      ],
    },
  },
})
