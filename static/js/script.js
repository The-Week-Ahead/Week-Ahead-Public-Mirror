function mod(n, m) {
  return ((n % m) + m) % m;
}

const THEMES = {
  light: {
    COLORS: [
      "#ecb55f",
      "#e3884e",
      "#e36433",
      "#cf492c",
      "#be2028",
      "#ab0a2a",
      "#890c38",
      "#731144",
    ],
    gCOLORS: ["#ea92ab", "#af7fc2", "#9085d0", "#8c76be", "#61567d"], // Grade Colors
    hCOLORS: ["#ac5fd3", "#ae2334", "#323353", "#4d9be6", "#165a4c"], // House Colors
    TOGGLE_COLORS: ["#c8fdaa", "#ff9e94", "#8fd3ff", "#fcdd7f", "#1a143b"],
    TOGGLE_COLOR_MAP: {
      "Society Events": "#c8fdaa",
      Academics: "#ff9e94",
      Sports: "#8fd3ff",
      Misc: "#fcdd7f",
    },
  },
  dark: {
    COLORS: [
      "#d4a560",
      "#c37c3d",
      "#b26025",
      "#a3481c",
      "#953c17",
      "#852113",
      "#721c29",
      "#5f1a33",
    ],
    gCOLORS: ["#c97d8b", "#9963b1", "#7c71c4", "#7764c3", "#4d4056"], // Grade Colors
    hCOLORS: ["#9b4bd2", "#a6233c", "#242442", "#3a7ece", "#134b3a"], // House Colors
    TOGGLE_COLORS: ["#a5e4a2", "#e07b7a", "#6ab8f4", "#e3e0a5", "#321b4e"],
    TOGGLE_COLOR_MAP: {
      "Society Events": "#1B5E20F2",
      Academics: "#B71C1CCC",
      Sports: "#5ba6f559",
      Misc: "#F57F17CC",
    },
  },
};

function getCurrentTheme() {
  return document.body.classList.contains("dark-mode") ? "dark" : "light";
}

// retrieve the appropriate color map based on the current theme
function getThemeColors() {
  const theme = getCurrentTheme();
  return THEMES[theme];
}

var tabletime = {};

let TIMETABLE = {};

const DAYS = [
  "All",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];
const TOGGLES = ["Society Events", "Academics", "Sports", "Misc", "All_t"];
const GRADE_LIST = ["All_g", "X", "XI", "FY", "SY"];
const HOUSE_LIST = ["All Houses", "Frere", "Napier", "Papworth", "Streeton"];

var filters = [];
var selected_day = 0;
var selected_grade = 0;
var selected_house = 0;

var filtered_timetable = {
  Monday: [],
  Tuesday: [],
  Wednesday: [],
  Thursday: [],
  Friday: [],
  Saturday: [],
  Sunday: [],
};

function updateTableVisibility() {
  const tableBody = document.getElementById("table-body");
  const tableContainer = document.querySelector(".table-container");

  if (tableBody.rows.length === 0) {
    tableContainer.style.display = "none";
  } else {
    tableContainer.style.display = "block";
  }
}

function master_filter(tbl, type) {
  var filtered_timetable = {
    Monday: [],
    Tuesday: [],
    Wednesday: [],
    Thursday: [],
    Friday: [],
    Saturday: [],
    Sunday: [],
  };

  if (type == "toggle") {
    let toggle_filters = filters.filter(
      (x) => !HOUSE_LIST.includes(x) && !GRADE_LIST.includes(x),
    );
    var target = toggle_filters;
  } else if (type == "grade") {
    var TOGGLES_LIST = ["Society Events", "Academics", "Sports", "Misc"];
    let grade_filters = filters.filter(
      (x) => !HOUSE_LIST.includes(x) && !TOGGLES_LIST.includes(x),
    );
    var target = grade_filters;

    if (grade_filters.includes("All_g")) {
      return tbl;
    }
  } else if (type == "house") {
    var TOGGLES_LIST = ["Society Events", "Academics", "Sports", "Misc"];
    let house_filters = filters.filter(
      (x) => !GRADE_LIST.includes(x) && !TOGGLES_LIST.includes(x),
    );
    var target = house_filters;
    if (house_filters.includes("All Houses")) {
      return tbl;
    }
  }

  for (var i = 1; i < 8; i++) {
    for (var j = 0; j < tbl[DAYS[i]].length; j++) {
      var found = target.some((r) => tbl[DAYS[i]][j][3].indexOf(r) >= 0);
      if (found) {
        filtered_timetable[DAYS[i]] = filtered_timetable[DAYS[i]].concat([
          tbl[DAYS[i]][j],
        ]);
      }
    }
  }

  return filtered_timetable;
}

function Clear() {
  var table = document.getElementById("table-body");
  var rowcount = table.rows.length;

  for (var i = rowcount - 1; i >= 0; i--) {
    table.deleteRow(i);
  }
  updateTableVisibility();
}

function parseDateTime(day, timeString) {
  const [startTime, endTime] = timeString.split(" - ");
  const [startHour, startMinute] = startTime.split(":");
  const [endHour, endMinute] = endTime.split(":");

  const today = new Date();
  const dayIndex = DAYS.indexOf(day);
  const dayDiff = dayIndex - today.getDay();

  const eventDate = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate() + dayDiff,
  );
  const startDate = new Date(
    eventDate.getFullYear(),
    eventDate.getMonth(),
    eventDate.getDate(),
    parseInt(startHour),
    parseInt(startMinute),
  );
  const endDate = new Date(
    eventDate.getFullYear(),
    eventDate.getMonth(),
    eventDate.getDate(),
    parseInt(endHour),
    parseInt(endMinute),
  );

  return { startDate, endDate };
}

function createICSFile(event) {
  const { day, time, title, location } = event;
  const { startDate, endDate } = parseDateTime(day, time);

  const formatDate = (date) => date.toISOString().replace(/-|:|\.\d+/g, "");

  const icsContent = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "BEGIN:VEVENT",
    `DTSTART:${formatDate(startDate)}`,
    `DTEND:${formatDate(endDate)}`,
    `SUMMARY:${title}`,
    `LOCATION:${location}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");

  return icsContent;
}

function downloadICS(icsContent, fileName) {
  const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function addToGoogleCalendar(event) {
  const { day, time, title, location } = event;
  const { startDate, endDate } = parseDateTime(day, time);

  const startDateTime = startDate.toISOString();
  const endDateTime = endDate.toISOString();

  const googleCalendarUrl = `https://www.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
    title,
  )}&dates=${startDateTime.replace(/[-:]/g, "")}/${endDateTime.replace(
    /[-:]/g,
    "",
  )}&details=${encodeURIComponent(`Location: ${location}`)}&sf=true&output=xml`;

  window.open(googleCalendarUrl, "_blank");
}

function addToCalendar(event) {
  addToGoogleCalendar(event);
}

function Add(day, clear) {
  if (!clear) {
    Clear();
    var tableHead = document.getElementById("table-head");
    tableHead.innerHTML = ""; // Clear existing header

    var headerRow = tableHead.insertRow(0);
    headerRow.classList.add("firstrow");
    var cell1 = headerRow.insertCell(0);
    var cell2 = headerRow.insertCell(1);
    var cell3 = headerRow.insertCell(2);

    cell1.innerHTML = "Time";
    cell2.innerHTML = "Event";
    cell3.innerHTML = "Location";

    const themeColors = getThemeColors();
    document.getElementById("daytext").style.backgroundColor =
      themeColors.COLORS[day];
    document.getElementById("day_lb").style.backgroundColor =
      themeColors.COLORS[day];
    document.getElementById("day_rb").style.backgroundColor =
      themeColors.COLORS[day];
  }

  var table = document.getElementById("table-body");
  var myStringArray = filtered_timetable[DAYS[day]];
  var arrayLength = myStringArray.length;

  for (var i = 0; i < arrayLength; i++) {
    var row = table.insertRow(table.rows.length);

    var cell1 = row.insertCell(0);
    var cell2 = row.insertCell(1);
    var cell3 = row.insertCell(2);
    // var cell4 = row.insertCell(3); // Uncomment if needed

    cell1.innerHTML = myStringArray[i][0];
    cell2.innerHTML = myStringArray[i][1];
    cell3.innerHTML = myStringArray[i][2];

    /*
    // Uncomment to add "Add to Calendar" buttons
    var addButton = document.createElement("button");
    addButton.innerText = "Add to Google Calendar";
    addButton.className = "add-to-calendar-btn";
    addButton.onclick = (function (event) {
      return function () {
        addToCalendar(event);
      };
    })({
      day: DAYS[day],
      time: myStringArray[i][0],
      title: myStringArray[i][1],
      location: myStringArray[i][2],
    });

    cell4.appendChild(addButton);
    */

    // Determine event type and set background color
    var eventType = myStringArray[i][3]
      .filter((x) => !GRADE_LIST.includes(x))
      .filter((x) => !HOUSE_LIST.includes(x))[0];
    const themeColors = getThemeColors();
    var bgColor = themeColors.TOGGLE_COLOR_MAP[eventType] || "";

    cell1.style.background = bgColor;
    cell2.style.background = bgColor;
    cell3.style.background = bgColor;
    // cell4.style.background = bgColor; // Uncomment if needed
  }
  selected_day = day;
  updateTableVisibility();
}

function All(a) {
  Clear();
  var tableHead = document.getElementById("table-head");
  tableHead.innerHTML = "";

  var headerRow = tableHead.insertRow(0);
  headerRow.classList.add("firstrow");
  var cell1 = headerRow.insertCell(0);
  var cell2 = headerRow.insertCell(1);
  var cell3 = headerRow.insertCell(2);
  var cell4 = headerRow.insertCell(3);

  cell1.innerHTML = "Day";
  cell2.innerHTML = "Time";
  cell3.innerHTML = "Event";
  cell4.innerHTML = "Location";

  var table = document.getElementById("table-body");
  let doneDays = [];
  for (var i = 1; i < 8; i++) {
    var myStringArray = filtered_timetable[DAYS[i]];
    var arrayLength = myStringArray.length;

    for (var j = 0; j < arrayLength; j++) {
      var row = table.insertRow(table.rows.length);

      var cell1 = row.insertCell(0);
      var cell2 = row.insertCell(1);
      var cell3 = row.insertCell(2);
      var cell4 = row.insertCell(3);
      // var cell5 = row.insertCell(4); // Uncomment if needed

      if (doneDays[i] != 1) {
        cell1.innerHTML = DAYS[i];
        doneDays[i] = 1;
      } else {
        cell1.innerHTML = "";
      }
      cell2.innerHTML = myStringArray[j][0];
      cell3.innerHTML = myStringArray[j][1];
      cell4.innerHTML = myStringArray[j][2];

      /*
      // Uncomment to add "Add to Calendar" buttons
      var addButton = document.createElement("button");
      addButton.innerText = "Add to Calendar";
      addButton.className = "add-to-calendar-btn";
      addButton.onclick = (function (event) {
        return function () {
          addToCalendar(event);
        };
      })({
        day: DAYS[i],
        time: myStringArray[j][0],
        title: myStringArray[j][1],
        location: myStringArray[j][2],
      });

      cell5.appendChild(addButton);
      */

      // Determine event type and set background color
      var eventType = myStringArray[j][3]
        .filter((x) => !GRADE_LIST.includes(x))
        .filter((x) => !HOUSE_LIST.includes(x))[0];
      const themeColors = getThemeColors();
      var bgColor = themeColors.TOGGLE_COLOR_MAP[eventType] || "";

      cell2.style.background = bgColor;
      cell3.style.background = bgColor;
      cell4.style.background = bgColor;
      // cell5.style.background = bgColor; // Uncomment if needed
    }
  }
  updateTableVisibility();

  selected_day = a;
  const themeColors = getThemeColors();
  document.getElementById("daytext").style.backgroundColor =
    themeColors.COLORS[0];
  document.getElementById("day_lb").style.backgroundColor =
    themeColors.COLORS[0];
  document.getElementById("day_rb").style.backgroundColor =
    themeColors.COLORS[0];
}

function store(name, value) {
  localStorage.setItem(name, value);
}

function getStore(name) {
  return localStorage.getItem(name);
}

function Shift_Grade(a) {
  selected_grade += a;
  var grade = selected_grade;
  grade = mod(grade, 5);
  swap_grade(grade);

  var text = document.getElementById("gradetext");
  const themeColors = getThemeColors();
  text.innerHTML = ["All Grades", "X", "XI", "FY", "SY"][grade];
  text.style.color = "#ffffff";
  document.getElementById("grade_lb").style.color = "#ffffff";
  document.getElementById("grade_rb").style.color = "#ffffff";

  text.style.backgroundColor = themeColors.gCOLORS[grade];
  document.getElementById("grade_lb").style.backgroundColor =
    themeColors.gCOLORS[grade];
  document.getElementById("grade_rb").style.backgroundColor =
    themeColors.gCOLORS[grade];

  store("selected_grade", grade);
}

function Shift_House(a) {
  selected_house += a;
  var house = selected_house;
  house = mod(house, 5);
  swap_house(house);

  var text = document.getElementById("housetext");
  text.innerHTML = ["All Houses", "Frere", "Napier", "Papworth", "Streeton"][
    house
  ];

  const themeColors = getThemeColors();
  text.style.backgroundColor = themeColors.hCOLORS[house];
  document.getElementById("house_lb").style.backgroundColor =
    themeColors.hCOLORS[house];
  document.getElementById("house_rb").style.backgroundColor =
    themeColors.hCOLORS[house];
}

function isTableEmpty() {
  var table = document.getElementById("table-body");
  return table.rows.length === 0;
}

function findFirstNonEmptyDay() {
  const today = new Date();
  let currentDay = today.getDay();
  if (currentDay === 0) currentDay = 1;

  for (let i = 0; i < 7; i++) {
    let checkDay = ((currentDay + i - 1) % 7) + 1;
    Add(checkDay);
    if (!isTableEmpty()) {
      return checkDay;
    }
  }
  console.log("No events found for the next week.");
  return currentDay;
}

function load() {
  fetch("/week-ahead/static/data/timetable.json")
    .then((response) => {
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      return response.json();
    })
    .then((data) => {
      TIMETABLE = data;

      Clear();

      filters = [
        "All_g",
        "X",
        "XI",
        "FY",
        "SY",
        "All Houses",
        "Frere",
        "Napier",
        "Papworth",
        "Streeton",
        "Society Events",
        "Academics",
        "Sports",
        "Misc",
      ];

      filtered_timetable = master_filter(TIMETABLE, "house");
      filtered_timetable = master_filter(filtered_timetable, "grade");
      filtered_timetable = master_filter(filtered_timetable, "toggle");

      selected_day = findFirstNonEmptyDay();
      Add(selected_day);

      var text = document.getElementById("daytext");
      text.innerHTML = DAYS[selected_day];

      Toggle(4);

      console.log("Filtered timetable:", filtered_timetable);
      updateTableVisibility();

      const savedGrade = getStore("selected_grade");
      const savedHouse = getStore("selected_house");

      if (savedGrade !== null) {
        if (savedGrade > 0) {
          let gradeDifference = parseInt(savedGrade) - selected_grade;
          if (gradeDifference !== 0) {
            if (gradeDifference > 0) {
              for (let i = 0; i < gradeDifference; i++) {
                Shift_Grade(1);
              }
            } else {
              for (let i = 0; i < Math.abs(gradeDifference); i++) {
                Shift_Grade(-1);
              }
            }
          }
        } else {
          swap_grade(0);
        }
      } else {
        swap_grade(0);
      }

      if (savedHouse !== null) {
        if (savedHouse > 0) {
          let houseDifference = parseInt(savedHouse) - selected_house;
          if (houseDifference !== 0) {
            if (houseDifference > 0) {
              for (let i = 0; i < houseDifference; i++) {
                Shift_House(1);
              }
            } else {
              for (let i = 0; i < Math.abs(houseDifference); i++) {
                Shift_House(-1);
              }
            }
          }
        } else {
          swap_house(0);
        }
      } else {
        swap_house(0);
      }
    })
    .catch((error) => {
      console.error("There was a problem with the fetch operation:", error);
    });
}

function swap_grade(grade) {
  var GRADE_LIST = ["All_g", "X", "XI", "FY", "SY"];

  filters = filters.filter((x) => !GRADE_LIST.includes(x));
  if (grade == 0) {
    filters = filters.concat(["All_g", "X", "XI", "FY", "SY"]); // Adds all back (0 = All grades)
  } else {
    filters = filters.concat(GRADE_LIST[grade]);
  }

  filtered_timetable = master_filter(TIMETABLE, "house");
  filtered_timetable = master_filter(filtered_timetable, "toggle");
  filtered_timetable = master_filter(filtered_timetable, "grade");

  Clear();

  if (selected_day == 0) {
    All(0);
  } else {
    Add(selected_day);
  }
  updateTableVisibility();

  const themeColors = getThemeColors();
  document.getElementById("gradetext").style.backgroundColor =
    themeColors.gCOLORS[grade];
  document.getElementById("grade_lb").style.backgroundColor =
    themeColors.gCOLORS[grade];
  document.getElementById("grade_rb").style.backgroundColor =
    themeColors.gCOLORS[grade];
}

function Shift_Day(a) {
  var day = selected_day;
  day += a;
  day = mod(day, 8);
  if (day == 0) {
    All(0);
  } else {
    Add(day);
    document.getElementById("daytext").style.color = "#ffffff";
    document.getElementById("day_lb").style.color = "#ffffff";
    document.getElementById("day_rb").style.color = "#ffffff";
  }

  var text = document.getElementById("daytext");
  text.innerHTML = DAYS[day];
}

function swap_house(house) {
  filters = filters.filter((x) => !HOUSE_LIST.includes(x));

  if (house == 0) {
    filters = filters.concat([
      "All Houses",
      "Frere",
      "Napier",
      "Papworth",
      "Streeton",
    ]);
  } else {
    filters = filters.concat(HOUSE_LIST[house]);
  }
  filtered_timetable = master_filter(TIMETABLE, "grade");
  filtered_timetable = master_filter(filtered_timetable, "toggle");
  filtered_timetable = master_filter(filtered_timetable, "house");
  Clear();
  if (selected_day == 0) {
    All(0);
  } else {
    Add(selected_day);
  }
  updateTableVisibility();

  const themeColors = getThemeColors();
  document.getElementById("housetext").style.backgroundColor =
    themeColors.hCOLORS[house];
  document.getElementById("house_lb").style.backgroundColor =
    themeColors.hCOLORS[house];
  document.getElementById("house_rb").style.backgroundColor =
    themeColors.hCOLORS[house];
}

function Toggle(n) {
  const toggleButton = document.getElementById(TOGGLES[n]);
  const isSelected = toggleButton.classList.contains("selected");

  const themeColors = getThemeColors();

  if (n === 4) {
    if (isSelected) {
      for (let i = 0; i < 4; i++) {
        document.getElementById(TOGGLES[i]).classList.remove("selected");
        filters = filters.filter((x) => x !== TOGGLES[i]);
      }
      toggleButton.classList.remove("selected");
    } else {
      for (let i = 0; i < 4; i++) {
        document.getElementById(TOGGLES[i]).classList.add("selected");
        if (!filters.includes(TOGGLES[i])) {
          filters.push(TOGGLES[i]);
        }
      }
      toggleButton.classList.add("selected");
    }
  } else {
    if (isSelected) {
      toggleButton.classList.remove("selected");
      filters = filters.filter((x) => x !== TOGGLES[n]);
    } else {
      toggleButton.classList.add("selected");
      if (!filters.includes(TOGGLES[n])) {
        filters.push(TOGGLES[n]);
      }
    }

    const allSelected = TOGGLES.slice(0, 4).every((toggle) =>
      document.getElementById(toggle).classList.contains("selected"),
    );
    document
      .getElementById(TOGGLES[4])
      .classList.toggle("selected", allSelected);
  }

  filtered_timetable = master_filter(TIMETABLE, "house");
  filtered_timetable = master_filter(filtered_timetable, "grade");
  filtered_timetable = master_filter(filtered_timetable, "toggle");

  Clear();
  if (selected_day == 0) {
    All(0);
  } else {
    Add(selected_day);
  }
  updateTableVisibility();
}

window.addEventListener("scroll", function () {
  var refreshButton = document.getElementById("refresh-button");
  if (window.scrollY > 50) {
    refreshButton.style.display = "block";
  } else {
    refreshButton.style.display = "none";
  }
});
