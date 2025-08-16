const habitForm = document.getElementById('habit-form');
const habitNameInput = document.getElementById('habit-input');
const habitFrequencySelect = document.getElementById('habit-frequency');
const habitList = document.getElementById('habit-list');
const habitTargetInput = document.getElementById('habit-target'); 
const completionDateInput = document.getElementById('completion-date');

let habits = [];

function loadHabits(){
    const stored = localStorage.getItem('habits');
    habits = stored ? JSON.parse(stored) : [];
} //loads habits from local storage

function saveHabits() {
    localStorage.setItem('habits', JSON.stringify(habits));
} //saves habits to local storage

//Consecutive Date/Week Checkers for Streak Calculation

function areDatesConsecutive(d1, d2){
    const date1 = new Date(d1);
    const date2 = new Date(d2);
    const diffMs = date2 - date1;
    const oneDayMs = 24 * 60 * 60 * 1000; //1 day in ms

    const marginMs  = 60 * 60 * 1000; //1 hour ms

    return diffMs >= (oneDayMs - marginMs) && diffMs <= (oneDayMs + marginMs); //checks if dates are consecutive with a +-1 hour margin
}
function areWeeksConsecutive(d1, d2) {
    d1.setHours(0,0,0,0);
    d2.setHours(0,0,0,0);
    const oneWeekMs = 7 * 24 * 60 * 60 * 1000;
    const twoWeekMs = oneWeekMs * 2;
    const diffMs = d2.getTime() - d1.getTime();
    return diffMs >= oneWeekMs && diffMs < twoWeekMs; //checks if two weeks are consecutive, by whether the difference in their ms is greater than one week(ms) but less than two weeks
}

//End of Consecutive Date/Week Checkers

//Streak Calculators for Weekly/Daily Frequency


function calculateWeeklyStreaks(habit){
   if (!habit.completionDates || habit.completionDates.length === 0) {
    habit.currentStreak = 0;
    habit.longestStreak = 0;
    return;
  } //if empty, return streak of 0

  const weeks = habit.completionDates.map(dateStr => getMondayDate(dateStr)).sort((a, b) => a - b); //creates sorted array of completion dates (only 1st monday of week) based on input date

  let longest = 1;
  let current = 1;

  for(let i = 1; i < weeks.length; i++){
    if(areWeeksConsecutive(weeks[i-1], weeks[i])){
        current++;
        if(current > longest) longest = current; //if consecutive && greater than current longest streak, update current to longest
    } else{
        current = 1;
    }
  }
  habit.longestStreak = longest; //updates longest streak

  let streakCount = 1;

  for(let i = weeks.length - 1; i > 0; i--){
    if(areWeeksConsecutive(weeks[i-1], weeks[i])){
        streakCount++; //increment current streak
    }else{
        break;
    }
  }
  habit.currentStreak = streakCount; //updates current streak
}

function calculateDailyStreaks(habit){
    if(!habit.completionDates || habit.completionDates.length === 0){
        habit.currentStreak = 0;
        habit.longestStreak = 0;
        return;
    } //if empty, set streak to 0

    habit.completionDates.sort();
    let longest = 1;
    let current = 1;

    for(let i = 1; i < habit.completionDates.length; i++){
        if(areDatesConsecutive(habit.completionDates[i-1], habit.completionDates[i])) {
            current++;
            if(current > longest) longest = current; //update longest streak to current if consecutive days and current > longest
        }else{
            current = 1;
        }
    }
    habit.longestStreak = longest; //updates longest streak of habit

    let streakCount = 1;
    

    for(let i = habit.completionDates.length - 1; i > 0; i--){
        if(areDatesConsecutive(habit.completionDates[i-1], habit.completionDates[i])){
            streakCount++;
        }else{
            break;
        }
    }
    habit.currentStreak = streakCount;
}

function calculateStreaks(habit){
    if(habit.frequency === 'weekly'){
        calculateWeeklyStreaks(habit)
    } else if(habit.frequency === 'daily'){
        calculateDailyStreaks(habit);
    } 
    //calls either calculateWeeklyStreaks or calculateDailyStreaks based on the frequency of each habit object
}

//End of Streak Calculators

//Date Formatters

//For Coding Purposes 

function parseLocalDate(dateStr) {
    const [yyyy, mm, dd] = dateStr.split('-').map(Number);
    return new Date(yyyy, mm - 1, dd); //takes in a string date to parse as a date object, month - 1 b/c January is 0, February is 1, etc.
}

function getMondayDate(dateStr) {
  const date = parseLocalDate(dateStr);
  const day = date.getDay();
  const diff = (day === 0 ? -6 : 1) - day; // Monday as start of week. If day is Sunday, set to -6, else set to 1.
  const monday = new Date(date);
  monday.setDate(date.getDate() + diff); //takes diff and adds it to the current date. From earlier *diff* is what's used to add/subtract from the current date to get Monday of the week. If the day is Sunday, Sunday - 6 = Monday. 
  monday.setHours(0, 0, 0, 0); //sets to midnight for safe consecutive week calculation
  return monday; 
}

//For UI Purposes 

function getMondayOfWeek(dateInput){
      let date;
    if(dateInput instanceof Date){
        date = new Date(dateInput);
    } else {
        date = parseLocalDate(dateInput);
    } //needs to parse a date object

    const day = date.getDay();
    const diff = (day === 0 ? -6 : 1) - day;
    const monday = new Date(date);
    monday.setDate(date.getDate() + diff);
    const mm = String(monday.getMonth() + 1).padStart(2, '0'); //pads string to reach a specific length, in this case adding zeros to months less than 10
    const dd = String(monday.getDate()).padStart(2, '0'); //same as above, but for days
    const yyyy = monday.getFullYear();
    return `Week of ${mm}-${dd}-${yyyy}`; //formats string for UI
}

function formatDay(dateStr){
    const date = parseLocalDate(dateStr);
    const mm = String(date.getMonth() + 1).padStart(2, '0'); //same as above function, but for date
    const dd = String(date.getDate()).padStart(2, '0');
    const yyyy = date.getFullYear(); 
    return `${mm}-${dd}-${yyyy}`; //U.S. format mm-dd-yyyy
}

function getLocalDateString(date = new Date()) {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`; // local time yyyy-mm-dd
}

//End of Date Formatters

function renderHabits(){
    
    const dailyList = document.getElementById('daily-habit-list'); //creates variables for lists and their respective containers
    const weeklyList = document.getElementById('weekly-habit-list');
    const dailyContainer = document.getElementById('daily-container');
    const weeklyContainer = document.getElementById('weekly-container');

    dailyList.innerHTML = '';
    weeklyList.innerHTML = '';
    const selectedDate = completionDateInput.value || getLocalDateString(); //takes the completion date input as a variable or the localDateString

    habits.forEach((habit, index) => {
        calculateStreaks(habit); 

        const li = document.createElement('li');
        li.className = 'habit-item';

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox'; //creates checkbox for each input
        
        let dateKey = habit.frequency === 'weekly' ? getLocalDateString(getMondayDate(selectedDate)) : getLocalDateString(parseLocalDate(selectedDate)); //parses the current day/week as a string
        checkbox.checked = habit.completionDates.includes(dateKey); //if current date is added to completionDates, checkbox is checked

        checkbox.addEventListener('change', () => {
            if(checkbox.checked){
                if(!habit.completionDates.includes(dateKey)){
                    habit.completionDates.push(dateKey);
                } //pushes the current dateKey to completionDates if not included
            } else {
                habit.completionDates = habit.completionDates.filter(date => date !== dateKey); //filters out any completion dates that match the current date on uncheck
            }
            saveHabits(); //saves changes to local
            renderHabits(); //re-render changes
        });

        const nameSpan = document.createElement('span');
        nameSpan.textContent = habit.name; //text content in the namespan will update the name param
        nameSpan.className = 'habit-name';
          if (habit.target && habit.target > 0) {
            const targetSpan = document.createElement('span');
            targetSpan.className = 'habit-target';
            targetSpan.textContent = ` (Target: ${habit.target})`; //adds target span if exists & greater than 0
            nameSpan.appendChild(targetSpan);
        }

        const streakDiv = document.createElement('div');
        streakDiv.className = 'streaks';
        const fire = habit.currentStreak > 0 ? '🔥' : ''; //adds a fire emoji if the streak is greater than 0, otherwise nothing
        const type = habit.frequency === 'weekly' ? 'week' : 'day'; //determines type of frequency

        let streakText; //creates placeholder streakText
    
        if(habit.target && habit.target > 0){
            if(habit.currentStreak > habit.target){ //if habit exists and the current streak is greater than target, display trophy
                streakText = `Current Streak: ${habit.currentStreak} ${type}${habit.currentStreak !== 1 ? 's' : ''} 🏆 | Longest Streak: ${habit.longestStreak} ${type}${habit.longestStreak !== 1 ? 's' : ''}`;
            } else{ //if habit exists and current streak is less than target, show as a fraction
                streakText = `Current Streak: ${habit.currentStreak}/${habit.target} ${type}${habit.currentStreak !== 1 ? 's' : ''} ${fire} | Longest Streak: ${habit.longestStreak} ${type}${habit.longestStreak !== 1 ? 's' : ''}`;
            }
        }
        else{ //otherwise show text without target
            streakText = `Current Streak: ${habit.currentStreak} ${type}${habit.currentStreak !== 1 ? 's' : ''} ${fire} | Longest Streak: ${habit.longestStreak} ${type}${habit.longestStreak !== 1 ? 's' : ''}`;
        }

        streakDiv.textContent = streakText; //sets the content as whatever is determined to be the above case

        const historyDiv = document.createElement('div'); 
        historyDiv.className = 'completion-history';
        let recentDates = habit.completionDates
            .slice(-5)
            .sort((a, b) => new Date(a) - new Date(b))
            .map(dateStr => {
                return habit.frequency === 'weekly'
                    ? getMondayOfWeek(dateStr) // nice week label
                    : formatDay(dateStr);      // nice day label
            })
            .join(', '); //takes the 5 most recent dates and adds them to a completion dates div. If the freq. is weekly, parse the date obj as a string reflecting the first monday. Else parse the date obj as a string reflecting the date completed
        
         if (!recentDates) recentDates = 'None yet'; //if no completed dates, push 'None yet'
        
        historyDiv.textContent = 'Completed on: ' + recentDates; //reflects whether the 5 most recent completed dates or nothing are pushed to the div

        const controlsDiv = document.createElement('div');
        controlsDiv.className = 'habit-controls';

        const editBtn = document.createElement('button');
            editBtn.textContent = 'Edit';
            editBtn.addEventListener('click', () => {
                const nameInput = document.createElement('input');
                nameInput.type = 'text';
                nameInput.value = habit.name;
                nameInput.className = 'habit-name';

                const targetInput = document.createElement('input');
                targetInput.type = 'number';
                targetInput.min = '1';
                targetInput.value = habit.target || '';
                targetInput.className = 'habit-target-input';
                targetInput.placeholder = 'Target';

                li.replaceChild(nameInput, nameSpan);
                li.insertBefore(targetInput, streakDiv);
                nameInput.focus(); //focuses on the habit.name input on edit

                editBtn.style.display = 'none'; //hide edit button on edit
                saveBtn.style.display = 'inline-block'; //show save and close on edit
                cancelBtn.style.display = 'inline-block';

                saveBtn.onclick = () => {
                    const newName = li.querySelector('input[type="text"]').value.trim();
                    const newTarget = parseInt(targetInput.value);
                    if(newName) habit.name = newName;
                    
                    if (!isNaN(newTarget) && newTarget > 0) habit.target = newTarget; //if new target is a number, overwrites the old one
                    else habit.target = undefined;

                    saveHabits(); //save and update habit.name locally on change
                    renderHabits();
                };

                cancelBtn.onclick = () => {
                    li.replaceChild(nameSpan, li.querySelector('input[type="text"]')); //replace the input with what was there previously on cancel

                    const targetInputEl = li.querySelector('.habit-target-input');
                    
                    if (targetInputEl) {
                             li.removeChild(targetInputEl);
                    } //removes extra target element created by editing

                    editBtn.style.display = 'inline-block'; //show edit on cancel
                    saveBtn.style.display = 'none'; //hide save and cancel on cancel
                    cancelBtn.style.display = 'none';
                };
            });
        
            const saveBtn = document.createElement('button');
            saveBtn.textContent = 'Save';
            saveBtn.style.display = 'none';

            const cancelBtn = document.createElement('button');
            cancelBtn.textContent = 'Cancel';
            cancelBtn.style.display = 'none';

            const deleteBtn = document.createElement('button');
            deleteBtn.textContent = 'Delete';
            deleteBtn.addEventListener('click', () => {
                if(confirm(`Delete habit "${habit.name}" ?`)) {
                    habits.splice(index, 1); //splices list of habits at the current habit index
                    saveHabits(); 
                    renderHabits(); //re-renders habits
                }
            });

            li.appendChild(checkbox);
            li.appendChild(nameSpan);
            li.appendChild(streakDiv);
            li.appendChild(historyDiv);
            controlsDiv.appendChild(editBtn);
            controlsDiv.appendChild(saveBtn);
            controlsDiv.appendChild(cancelBtn);
            controlsDiv.appendChild(deleteBtn);
            li.appendChild(controlsDiv);
            //adds different divs/items to their respective parents

            if(habit.frequency === 'daily'){
            dailyList.appendChild(li); //appends daily habits to daily list
            } else if(habit.frequency === 'weekly'){
            weeklyList.appendChild(li); //appends weekly habits to separate weekly list
            }
    });
    dailyContainer.style.display = dailyList.children.length > 0 ? 'block' : 'none'; //hides daily div if empty list
    weeklyContainer.style.display = weeklyList.children.length > 0 ? 'block' : 'none';//hides weekly div if empty list
}

habitForm.addEventListener('submit', e => {
    e.preventDefault();
    const name = habitNameInput.value.trim();
    if(!name) return alert('Please enter a habit name.');

    const frequency = habitFrequencySelect.value;
    const target = parseInt(habitTargetInput.value);

    habits.push({
        name, 
        frequency,
        target: !isNaN(target) && target > 0 ? target : undefined,
        completionDates: [],
        currentStreak: 0,
        longestStreak: 0,
    }); //on submit, push a habit with above attributes

    saveHabits();
    habitNameInput.value = ''; //clear input bar
    renderHabits();
    });

    completionDateInput.addEventListener('change' , () => {
        renderHabits();
    }); //if any changes to completion date, re-render

    loadHabits(); //initial load

    if(!completionDateInput.value){
        completionDateInput.value = getLocalDateString();
    }
    renderHabits(); //initial render