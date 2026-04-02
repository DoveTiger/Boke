const CJK_PINYIN_MAP: Record<string, string> = {
  嵌: 'qian',
  入: 'ru',
  式: 'shi',
  应: 'ying',
  用: 'yong',
  工: 'gong',
  程: 'cheng',
  实: 'shi',
  践: 'jian',
  开: 'kai',
  发: 'fa',
  技: 'ji',
  术: 'shu',
  架: 'jia',
  构: 'gou',
  系: 'xi',
  统: 'tong',
  调: 'tiao',
  试: 'shi',
  方: 'fang',
  法: 'fa',
};

export function normalizeToSlug(input: string): string {
  const output: string[] = [];

  for (const char of input.trim()) {
    if (/^[a-z0-9]$/i.test(char)) {
      output.push(char.toLowerCase());
      continue;
    }

    if (CJK_PINYIN_MAP[char]) {
      output.push('-', CJK_PINYIN_MAP[char]);
      continue;
    }

    if (/\s|[_\-./]/.test(char)) {
      output.push('-');
    }
  }

  return output
    .join('')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}