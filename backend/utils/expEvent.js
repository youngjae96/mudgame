// 경험치 이벤트 배율은 반드시 이 유틸 함수(setExpEventBonus, clearExpEventBonus)로만 관리하세요.
// 직접 global.EVENT_EXP_BONUS를 수정하지 마세요. (일관성 유지)
//
// 사용 예시:
//   setExpEventBonus(1.2); // 이벤트 시작
//   clearExpEventBonus();   // 이벤트 종료

// 경험치 이벤트 배율 관리 유틸
function setExpEventBonus(value) {
  global.EVENT_EXP_BONUS = value;
  global.expDoubleEvent = !!(value && value > 1);
}

function clearExpEventBonus() {
  global.EVENT_EXP_BONUS = undefined;
  global.expDoubleEvent = false;
}

function getExpEventBonus() {
  return global.EVENT_EXP_BONUS || 1;
}

module.exports = { setExpEventBonus, clearExpEventBonus, getExpEventBonus }; 