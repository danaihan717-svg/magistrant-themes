module.exports = [
  {
    name: { kk: "Мемлекеттік-құқықтық пәндер орталығы", ru: "Центр государственного и правового права" },
    maxStudents: 31,
    topics: Array.from({length:7}, (_, i) => ({
      id: i+1,
      title: { kk: `Тақырып ${i+1} (құқық)`, ru: `Тема ${i+1} (право)` },
      student: null,
      time: null
    }))
  },
  {
    name: { kk: "Азаматтық-құқықтық пәндер орталығы", ru: "Центр гражданского права" },
    maxStudents: 31,
    topics: Array.from({length:7}, (_, i) => ({
      id: i+1,
      title: { kk: `Тақырып ${i+1} (азаматтық)`, ru: `Тема ${i+1} (гражданское)` },
      student: null,
      time: null
    }))
  },
  {
    name: { kk: "Қылмыстық-құқықтық пәндер орталығы", ru: "Центр уголовного права" },
    maxStudents: 31,
    topics: Array.from({length:7}, (_, i) => ({
      id: i+1,
      title: { kk: `Тақырып ${i+1} (қылмыс)`, ru: `Тема ${i+1} (уголовное)` },
      student: null,
      time: null
    }))
  }
];
