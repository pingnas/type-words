export default function SlidePlugin() {
  return {
    name: 'slide-plugin',
    transform(code, id) {
      if (id.endsWith('main.ts')) {
        return code + `

        `;
      }
      return code;
    }
  };
}
