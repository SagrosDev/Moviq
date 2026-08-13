const meaningfulTextPattern = /[\p{L}\p{N}\p{P}\p{S}]/u;

export const hasMeaningfulText = (value: string) => meaningfulTextPattern.test(value);
