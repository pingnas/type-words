declare global {
  interface Console {
    parse(v: any): void

    json(v: any, space: number): string
  }

  interface Window {
    umami: {
      track(name: string, data?: any): void
    },
    JSZip: any,
    __CURRENT_WORD_INFO__?: {
      word: string,
      input: string,
      inputLock: boolean,
      containsSpace: boolean
    }
  }
}


console.json = function (v: any, space = 0) {
  const json = JSON.stringify(
    v,
    (key, value) => {
      if (Array.isArray(value)) {
        return `__ARRAY__${JSON.stringify(value)}`;
      }
      return value;
    },
    space
  ).replace(/"__ARRAY__(\[.*?\])"/g, (_, arr) => arr);
  console.log(json);
  return json;
}
console.parse = function (v: any) {
  console.log(JSON.parse(v))
}

export {}
