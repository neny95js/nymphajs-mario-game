import { loadImage, SpriteSheet } from '@nymphajs/dom-api';

// prettier-ignore
const CHARS = ' !"#$%&\'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstuvwxyz{|}~';

export class Font {
  constructor(private sprites: SpriteSheet, public size: number) {}

  print(text: string, context: CanvasRenderingContext2D, x: number, y: number) {
    const size = this.size;
    [...text].forEach((char, pos) => {
      this.sprites.draw(char, context, x + pos * size, y);
    });
  }
}

export async function loadFont() {
  return loadImage('./assets/font.png').then((image) => {
    const fontSprite = new SpriteSheet(image, 8, 8);

    const size = 8;
    const rowLen = image.width;

    for (let [index, char] of [...CHARS].entries()) {
      const x = (index * size) % rowLen;
      const y = Math.floor((index * size) / rowLen) * size;

      fontSprite.define(char, x, y, size, size);
    }

    return new Font(fontSprite, size);
  });
}
