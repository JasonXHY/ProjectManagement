declare module 'word-extractor' {
  class WordExtractor {
    extract(filePath: string): Promise<{
      getText(): string
      getBody(): string
    }>
  }
  export default WordExtractor
}
