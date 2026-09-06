// 目前 MVP 只開放「二年級 × 乘法口訣」。之後要擴充年級/科目，
// 只要在這裡加新的項目，管理介面的下拉選單與學生端的過濾邏輯不需要改動。
export const GRADES = [2];

export const SUBJECTS = [
  { value: 'multiplication', label: '乘法口訣' },
];

export const subjectLabel = (value) => SUBJECTS.find((s) => s.value === value)?.label || value;
