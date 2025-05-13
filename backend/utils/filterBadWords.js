// 한국어 욕설 리스트 (예시, 실제 서비스 시 더 추가 필요)
const badwords = [
  "씨발", "ㅅㅂ", "개새끼", "병신", "좆", "새끼", "지랄", "미친", "염병", "좃", "ㅄ", "ㅂㅅ", "ㅄ", "ㅂ ㅅ", "ㅅ ㅂ", "ㅅ-ㅂ", "ㅂ-ㅅ", "ㅅ바", "ㅄ새끼", "ㅄ같은", "ㅄ같이", "ㅄ같네", "ㅄ같다", "ㅄ이", "ㅄ임", "ㅄ임?", "ㅄ임.", "ㅄ임,"
];

function filterBadWords(message) {
  let filtered = message;
  badwords.forEach(word => {
    const regex = new RegExp(word.replace(/([.*+?^=!:${}()|[\]\/\\])/g, "\\$1"), 'gi');
    filtered = filtered.replace(regex, '***');
  });
  return filtered;
}

module.exports = { filterBadWords }; 