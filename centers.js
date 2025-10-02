module.exports = [
  {
    name: { kk: "Мемлекеттік-құқықтық пәндер орталығы", ru: "Центр государственного и правового права" },
    maxStudents: 31,
    topics: Array.from({length:7}, (_,i)=>({id:i+1, title:{kk:`Тақырып ${i+1} (МҚ)`, ru:`Тема ${i+1} (ГП)`}, student:null, time:null}))
  },
  {
    name: { kk: "Азаматтық-құқықтық пәндер орталығы", ru: "Центр гражданского права" },
    maxStudents: 31,
    topics: Array.from({length:7}, (_,i)=>({id:i+1, title:{kk:`Тақырып ${i+1} (АҚ)`, ru:`Тема ${i+1} (ГП)`}, student:null, time:null}))
  },
  {
    name: { kk: "Қылмыстық-құқықтық пәндер орталығы", ru: "Центр уголовного права" },
    maxStudents: 31,
    topics: Array.from({length:7}, (_,i)=>({id:i+1, title:{kk:`Тақырып ${i+1} (ҚҚ)`, ru:`Тема ${i+1} (УП)`}, student:null, time:null}))
  }
];
