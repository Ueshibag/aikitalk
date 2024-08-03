
const Version = "1.1.2";

const GET_READY_TXT = 'Préparez vous';

// text-to-speech
var tts = [];
var current_tts_index = 0;

var timeoutID;
var paused = false;

let intro_interval = 2000;
const INTERVAL_MIN = 3;
let introIndex = 0;

var audio = document.getElementById('myAudio');

// Opens navigation left bar.
function open_nav() {
    const viewportWidth = window.innerWidth;
    document.getElementById("mySidenav").style.width = `${viewportWidth}px`;
    document.getElementById("main").style.marginLeft = `${viewportWidth}px`;
}

// Closes navigation left bar.
function close_nav() {
    document.getElementById("mySidenav").style.width = "0";
    document.getElementById("main").style.marginLeft = "0";
}

/*
The DOMContentLoaded event fires when the HTML document has been completely parsed,
and all deferred scripts have downloaded and executed. It doesn't wait for other
things like images, sub-frames, and async scripts to finish loading.
*/
document.addEventListener('DOMContentLoaded', (event) => {

    initialize();
});

async function initialize() {

    console.log("initialize");

    const response = await fetch('/get_grades_files');
    const grades_files = await response.json();

    const grade_select = document.getElementById('grade_select');

    set_grade_selector_items(grades_files);

    grade_select.addEventListener('change', (e) => {
        
        select_grade(e.target.value);
    });

    on_interval_slider_change();

    on_repetition_slider_change();
 
    on_kokyunage_slider_change();

    reset_left_navbar_widgets();

    select_grade(grade_select.value);

    console.log("DOM fully loaded and parsed. UI initialized.");
};


function reset_left_navbar_widgets() {

    document.getElementById('droite_gauche').checked = true;
    document.getElementById('aleatoire').checked = false;
    document.getElementById('omote_ura').checked = true;
}


function set_grade_selector_items(grades_files) {

    const grade_select = document.getElementById('grade_select');

    for (let grade_file of grades_files) {

        let dot_index = grade_file.lastIndexOf('.');
        let grade_name = grade_file.substring(0, dot_index);
        const option = document.createElement('option');
        option.value = grade_name;
        option.textContent = grade_name.charAt(0).toUpperCase() + grade_name.slice(1);
        option.textContent = option.textContent.slice(0, 3).concat(' ', option.textContent.slice(3));
        grade_select.appendChild(option);
    }
}


function on_kokyunage_slider_change() {

    const kokyunage_select = document.getElementById('kokyunage_select');
    let kokyunage_value = document.getElementById("kokyunage_value");
    kokyunage_select.value = 1;
    kokyunage_select.addEventListener('input', (e) => {

        kokyunage_value.textContent = kokyunage_select.value;
    });
}

function on_repetition_slider_change() {

    const repetition_select = document.getElementById('repetition_select');
    let repetition_value = document.getElementById("repetition_value");
    repetition_select.value = 0;
    repetition_select.addEventListener('input', (e) => {

        repetition_value.textContent = repetition_select.value;
    });
}

function on_interval_slider_change() {

    const interval_select = document.getElementById('interval_select');
    let interval_value = document.getElementById("interval_value");
    interval_select.value = INTERVAL_MIN;
    interval_select.addEventListener('input', (e) => {

        interval_value.textContent = interval_select.value;
    });
}

/*
On grade selection, parse the corresponding INI file and update
the situation and attack selectors.
*/
async function select_grade(grade) {

    console.log("select_grade " + grade);

    // Augment the number of requested kokyu nage for higher grades
    const kokyunage_select = document.getElementById('kokyunage_select');
    let kokyunage_value = document.getElementById("kokyunage_value");

    switch (grade) {

        case 'kyu5':
        case 'kyu4':
        case 'kyu3':
            kokyunage_select.value = 1;
            kokyunage_value.textContent = 1;
            break;
        case 'kyu2':
        case 'kyu1':
            kokyunage_select.value = 2;
            kokyunage_value.textContent = 2;
            break;
        case 'dan1':
            kokyunage_select.value = 3;
            kokyunage_value.textContent = 3;
            break;
        case 'dan2':
            kokyunage_select.value = 4;
            kokyunage_value.textContent = 4;
            break;
        case 'dan3':
        case 'dan4':
            kokyunage_select.value = 5;
            kokyunage_value.textContent = 5;
            break;
    }

    // Combine API endpoint with query parameters
    const apiUrl = '/get_data';

    // Set up query parameters
    const queryParams = {
        ini_file_name: grade + '.ini',
    };

    // Convert query parameters to a string
    const queryString = new URLSearchParams(queryParams).toString();

    // Combine API endpoint with query parameters
    const fullUrl = `${apiUrl}?${queryString}`;

    // Call the Flask route /get_data function with the INI file name as argument
    const response = await fetch(fullUrl);
    const data = await response.json();

    set_situation_and_attack_selector_items(data);

    reset_left_navbar_widgets();
 }


function set_situation_and_attack_selector_items(data) {

    set_situation_selector_items(data);

    const situation_select = document.getElementById('situation_select');

    situation_select.addEventListener('change', (e) => {

        const selected_situation = e.target.value;
        set_situation_dependent_widgets_state(selected_situation);
        set_attack_selector_items(selected_situation, data);
    });
    
    // React everytime the attack is changed.
    attack_select.addEventListener('change', (e) => {

        build_session();
    });

    situation_select.dispatchEvent(new Event('change'));
}


function set_situation_dependent_widgets_state(situation) {

    const droite_gauche = document.getElementById('droite_gauche');
    const non_spec = document.getElementById('non_spec');
    const omote_ura = document.getElementById('omote_ura');
    const omote_ura_group = document.getElementsByName('omote_ura');

    // droite & gauche
    switch (situation.toLowerCase()) {

        case 'ken tai ken':
        case 'futari dori':
            droite_gauche.checked = false;
            droite_gauche.disabled = true;
            break;
    }

    // omote & ura
    switch (situation.toLowerCase()) {

        case 'tanto dori':
        case 'jo dori':
        case 'jo nage waza':
        case 'tachi dori':
        case 'ken tai ken':
        case 'jo tai jo':
        case 'futari dori':
            non_spec.checked = true;
            omote_ura_group.disabled = true;
            break;
        default:
            omote_ura.checked = true;
    }
}


function set_situation_selector_items(data) {

    const situation_select = document.getElementById('situation_select');
    situation_select.options.length = 0;

    for (const situation in data) {

        const option = document.createElement('option');
        option.value = situation;
        option.textContent = situation;
        situation_select.appendChild(option);
    }
}


function set_attack_selector_items(selected_situation, data) {

    const attack_select = document.getElementById('attack_select');
    attack_select.options.length = 0;
    attack_select.innerHTML = '';

    for (const attack in data[selected_situation]) {
        const option = document.createElement('option');
        option.value = attack;
        option.textContent = attack;
        attack_select.appendChild(option);
    }
    build_session();
}


function set_side_nav_content_disabled() {

    var childNodes = document.getElementById("mySidenav").getElementsByTagName('*');
    for (var node of childNodes) {
        node.disabled = true;
    }
}


function set_side_nav_content_enabled() {

    var childNodes = document.getElementById("mySidenav").getElementsByTagName('*');
    for (var node of childNodes) {
        node.disabled = false;
    }
}


function set_session_text_area_content_disabled() {

    var childNodes = document.getElementById("session_text_area").getElementsByTagName('*');
    for (var node of childNodes) {
        node.disabled = true;
    }
}


function set_session_text_area_content_enabled() {

    var childNodes = document.getElementById("session_text_area").getElementsByTagName('*');
    for (var node of childNodes) {
        node.disabled = false;
    }
}


function uncheck_jyu_wazas() {

    console.log("uncheck_jyu_wazas");
    var childNodes = document.getElementById("session_text_area").getElementsByTagName('*');
    for (var node of childNodes) {

        console.log(node.textContent);
        if (node.textContent.toLowerCase() == "jyu waza") {
            node.firstChild.checked = false;
        } else if (node.firstChild != null) {
            node.firstChild.checked = true;
        }
    }
}


/*
On Start button click.
*/
function start_session() {

    console.log("start_session");

    close_nav();
    document.getElementById('startBtn').disabled = true;
    document.getElementById('pauseBtn').disabled = false;
    document.getElementById('stopBtn').disabled = false;
    document.getElementById('helpBtn').disabled = true;
    document.getElementById('homeBtn').disabled = true;
    set_side_nav_content_disabled();
    set_session_text_area_content_disabled();

    // Build the list of text to be speeched
    tts = [];
    var techniques = [];
    tts.push(GET_READY_TXT);
    var session_text = document.getElementById('session_text_area').children;
    
    for (var i = 0; i < session_text.length; i++) {

        if (session_text[i].tagName != "LABEL") {
            continue;
        }

        if (session_text[i].id == "situation")  {

            tts.push(session_text[i].textContent);

        } else if ((session_text[i].firstElementChild != null) && session_text[i].firstElementChild.className == "parent-checkbox" && session_text[i].firstElementChild.checked) {

            // Checked attack item
            if (techniques.length > 0) {

                // This is not the first attack. Store techniques of the previous one.
                techniques = manage_techniques(techniques);
                tts.push.apply(tts, techniques);
                techniques = [];
            }

            // Store the attack name
            tts.push(session_text[i].textContent);
        
        } else if ((session_text[i].firstElementChild != null) && session_text[i].firstElementChild.className.includes("child-checkbox") && session_text[i].firstElementChild.checked) {

            // Checked technique item; store it.
            // If this is 'jyu waza', ask for as many 'jyu waza N' as we have techniques for this attack.
            if (session_text[i].textContent.toLowerCase() == "jyu waza") {
                
                const parentClass = session_text[i].firstElementChild.classList[1];
                const siblings = document.querySelectorAll(`.${parentClass}`);
                
                for (let i = 1; i < siblings.length; i++) {
                    techniques.push("jyu waza" + ". " + i);
                };

            } else {
                techniques.push(session_text[i].textContent);
            }
        }

        // minus 2 to take trailing <br>s into account
        if (i == session_text.length - 2) {

            // End of session; manage and store techniques
            techniques = manage_techniques(techniques);
            tts.push.apply(tts, techniques);
        }
    }

    tts.push('Terminé');
    current_tts_index = 0;
    setTimeout(play_technique, 0);
}


function get_omote_ura_value() {

    var eles = document.getElementsByName('omote_ura');

    for (let e of eles) {

        if (e.checked) return e.value;
    }
}

/*
Returns true if the technique argument exists in both omote and ura forms; false otherwise.
*/
function is_urable(tech) {

    return tech.toLowerCase() == "ikkyo" ||
    tech.toLowerCase() == "nikyo" ||
    tech.toLowerCase() == "sankyo" ||
    tech.toLowerCase() == "yonkyo" ||
    tech.toLowerCase() == "shiho nage" ;
}

/*
Applies techniques options if they are set (repetition, right-and-left and random).
*/
function manage_techniques(old_techs) {

    new_techs = [];
    const kokyunage_select = document.getElementById('kokyunage_select');

    for (let tech of old_techs) {

        if (is_urable(tech)) {

            if (get_omote_ura_value() == "omote_ura") {
                new_techs.push(tech + " omote");
                new_techs.push(tech + " ura");
            } else if (get_omote_ura_value() == "omote") {
                new_techs.push(tech + " omote");
            } else if (get_omote_ura_value() == "ura") {
                new_techs.push(tech + " ura");
            } else {
                new_techs.push(tech);
            }

        } else if (tech.toLowerCase() == "kokyu nage" && kokyunage_select.value > 1) {

            for (let i = 1; i <= kokyunage_select.value; i++) {
                new_techs.push(tech + " " + i);
            }
        
        } else {
            new_techs.push(tech);
        }
    }

    const repetition_select = document.getElementById('repetition_select');
    if (Number(repetition_select.value) > 0) {
        new_techs = repeatItems(new_techs, Number(repetition_select.value));
    }

    const droite_gauche = document.getElementById('droite_gauche').checked;
    if (droite_gauche) {
        new_techs = new_techs.flatMap(tech => [`${tech} à droite`, `${tech} à gauche`]);
    }

    const aleatoire = document.getElementById('aleatoire').checked;
    if (aleatoire) {
        new_techs = new_techs.sort(() => Math.random() - 0.5);
    }
    return new_techs;
}

/*
Takes a list and a number 'n' as parameters, and returns a new list where each
item in the original list is repeated 'n' times.
If the original list is ['a', 'b', 'c'], and n = 3
the returned value is: ['a', 'a', 'a', 'b', 'b', 'b', 'c', 'c', 'c']
*/
function repeatItems(list, n) {
    let result = [];
    for (let item of list) {
        for (let i = 0; i < n+1; i++) {
            result.push(item);
        }
    }
    return result;
}


/*
Plays the text located in 'tts' array at 'current_tts_index'.
*/
async function play_technique() {

    if (current_tts_index < tts.length) {

        const text = tts[current_tts_index];

        // Call the 'speak' Flask route with the 'text' parameter.
        const response = await fetch(`/speak?text=${encodeURIComponent(text)}`);
        const blob = await response.blob();
        
        // Get the technique.mp3 file from blob.
        const url = URL.createObjectURL(blob);
        audio.src = url;

        // Play the MP3 file.
        audio.play().catch(error => {
            console.log("User gesture required to start audio playback:", error);
        });

        audio.onended = () => {
            
            // The text has been said.
            if (text == 'Terminé') {

                stop_session();

            } else {

                clearTimeout(timeoutID);

                if (paused) {
                    current_tts_index++;
                    return;

                } else if (tts.length > 0) {

                    if (is_technique(text)) {

                        const user_defined_interval_value = document.getElementById('interval_select').value * 1000;
                        timeoutID = setTimeout(play_technique, user_defined_interval_value);

                    } else {

                        // Get ready, situation or attack.
                        timeoutID = setTimeout(play_technique, intro_interval);
                    }
                }
                current_tts_index++;
            }
        };
    }
}


/*
Situations and attacks are followed by a fixed 4s pause, while the
time interval between techniques is user-defined.
*/
function is_technique(text) {

    if (text == GET_READY_TXT) {
        return false;
    }

    const situations = document.getElementById('situation_select').children;
    for (var i = 0; i < situations.length; i++) {

        if (situations[i].value.trim() == text.trim()) {
            return false;
        }
    }

    const attacks = document.getElementById('attack_select').children;
    for (var i = 0; i < attacks.length; i++) {

        if (attacks[i].value.trim() == text.trim()) {
            return false;
        }
    }

    return true;
}

/*
On 'Pause' button click.
*/
function pause_session() {

    console.log("pause_session");

    if (!paused) {

        // Pause
        console.log("  pause");
        clearTimeout(timeoutID);
        document.getElementById('pauseBtn').innerHTML = '<i class="fas fa-play"></i>';

    } else {

        // Resume
        console.log("  resume");
        const intervalValue = document.getElementById('interval_select').value * 1000;
        document.getElementById('pauseBtn').innerHTML = '<i class="fas fa-pause"></i>';
        timeoutID = setTimeout(play_technique, intervalValue);
    }

    paused = !paused;
}


/*
On 'Stop' button click.
*/
function stop_session() {

    console.log("stop_session");

    clearTimeout(timeoutID);
    tts.length = 0;

    document.getElementById('startBtn').disabled = false;
    document.getElementById('pauseBtn').disabled = true;
    document.getElementById('pauseBtn').innerHTML = '<i class="fas fa-pause"></i>';
    document.getElementById('stopBtn').disabled = true;
    document.getElementById('helpBtn').disabled = false;
    document.getElementById('homeBtn').disabled = false;

    set_side_nav_content_enabled();
    set_session_text_area_content_enabled();
    uncheck_jyu_wazas();

    paused = false;
}


/*
On homeBtn click, displays :
- the selected grade
- the selected situation
- the selected attack or all attacks, each one being followed by applicable techniques

Techniques are presented as checkboxes, selected by default. The user can unselect
techniques, keeping selected those he wants to work on.
*/
async function build_session() {

    console.log("build_session");

    set_side_nav_content_enabled();

    const gradeSelect = document.getElementById('grade_select');
    const situation_select = document.getElementById('situation_select');
    const attack_select = document.getElementById('attack_select');

    // Set up query parameters
    const queryParams = {
        ini_file_name: gradeSelect.value + '.ini',
    };

    // Combine API endpoint with query parameters
    const apiUrl = '/get_data';

    // Convert query parameters to a string
    const queryString = new URLSearchParams(queryParams).toString();

    // Combine API endpoint with query parameters
    const fullUrl = `${apiUrl}?${queryString}`;

    // Call the Flask route /get_data function with the INI file name as argument
    const response = await fetch(fullUrl);
    const data = await response.json();

    // Display the selected grade
    let text_area = document.getElementById('session_text_area');
    let grade = gradeSelect.value.charAt(0).toUpperCase() + gradeSelect.value.slice(1);
    grade = grade.slice(0, 3).concat(' ', grade.slice(3));
    
    text_area.innerHTML = `<label id="grade" style="font-size: 28px; font-weight: bold;">${grade}</label><br><br>`;
    
    // Display the selected situation
    text_area.innerHTML += `<label id="situation" style="font-size: 22px; font-weight: bold;">${situation_select.value}</label><br><br>`;

    let situation = situation_select.value;

    // Display one or all attacks, followed by the applicable techniques.
    if (attack_select.value.toLowerCase() == "toutes les attaques") {

        for (const attack_name in data[situation]) {

            text_area.innerHTML += "<div>"; // attack

            if (attack_name.toLowerCase() == "toutes les attaques") {
                break; // Do not print "Toutes Les Attaques" as an attack name
            }
            var underscored_attack_name = attack_name.replace(/ /g, '_');
            text_area.innerHTML += `<label style="font-size: 18px; font-weight: bold;"><input type="checkbox" checked id=${underscored_attack_name} class="parent-checkbox">${attack_name}</label>`;
        
            var i = 0;
            for (const technique in data[situation][attack_name]) {

                text_area.innerHTML += "<div>"; // technique
                let tech_name = data[situation][attack_name][i++];
                var underscored_tech_name = tech_name.replace(/ /g, '_');
                text_area.innerHTML += `<label><input style="margin-left: 50px;" type="checkbox" ${checked_if_not_jyu_waza(tech_name)} id="${underscored_tech_name}" class="child-checkbox ${underscored_attack_name}">${bold_if_jyu_waza(tech_name)}</label>`;
                text_area.innerHTML += "</div>"; // technique
            }

            text_area.innerHTML += "</div>"; // attack
        }

    } else {

        // One single attack selected.
        text_area.innerHTML += "<div>"; // attack

        let attack_name = attack_select.value;
        var underscored_attack_name = attack_name.replace(/ /g, '_');
        text_area.innerHTML += `<label style="font-size: 18px; font-weight: bold;"><input type="checkbox" checked id="${underscored_attack_name}" class="parent-checkbox">${attack_name}</label>`;

        var i = 0;
        for (const technique in data[situation][attack_name]) {

            text_area.innerHTML += "<div>"; // technique
            let tech_name = data[situation][attack_name][i++];
            var underscored_tech_name = tech_name.replace(/ /g, '_');
            text_area.innerHTML += `<label><input style="margin-left: 50px;" type="checkbox" ${checked_if_not_jyu_waza(tech_name)} id="${underscored_tech_name}" class="child-checkbox ${underscored_attack_name}">${bold_if_jyu_waza(tech_name)}</label>`;
            text_area.innerHTML += "</div>"; // technique
        }

        text_area.innerHTML += "</div>"; // attack
        text_area.innerHTML += '<br>';
    }

    document.getElementById('startBtn').disabled = false;
    document.getElementById('helpBtn').disabled = false;

    add_session_event_listeners();
}


/*
All techniques, excepted 'jyu waza' are checked by default.
Checking 'jyu waza' unchecks the other techniques.
*/
function checked_if_not_jyu_waza(tech) {

    if (tech == "Jyu waza") {
        return ""
    } else {
        return "checked";
    }
}


/*
'Jyu waza' is displayed in bold characters.
*/
function bold_if_jyu_waza(tech) {

    if (tech == "Jyu waza") {
        return "<b>" + tech + "</b>";
    } else {
        return tech;
    }
}


/*
Attacks and techniques checkboxes listeners.
*/
function add_session_event_listeners() {

    const parentCheckboxes = document.querySelectorAll('.parent-checkbox');
    const childCheckboxes = document.querySelectorAll('.child-checkbox');

    parentCheckboxes.forEach(parent => {

        // Attack checkbox listener.
        parent.addEventListener('change', function() {

            let all_parents_disabled = true;
            const childClass = this.id;
            const children = document.querySelectorAll(`.${childClass}`);

            if (! this.checked) {

                children.forEach(child => {
                    child.disabled = false;
                });
            }

            children.forEach(child => {

                if (child.id != "Jyu_waza") {
                    child.checked = this.checked;
                } else if (! this.checked) {
                    child.checked = false;
                }
            });

            parentCheckboxes.forEach(parent => {
                if (parent.checked) {
                    all_parents_disabled = false;
                }
            });

            document.getElementById('startBtn').disabled = all_parents_disabled;
        });
    });

    childCheckboxes.forEach(child => {

        // Technique checkbox listener.
        child.addEventListener('change', function() {

            let all_parents_disabled = true;
            const parentClass = this.classList[1];
            const parent = document.getElementById(parentClass);
            const siblings = document.querySelectorAll(`.${parentClass}`);
            let anyChecked = false;

            siblings.forEach(sibling => {
                if (sibling.checked) {
                    anyChecked = true;
                }
            });

            // An attack is checked if at least one child technique is checked.
            parent.checked = anyChecked;

            parentCheckboxes.forEach(parent => {
                if (parent.checked) {
                    all_parents_disabled = false;
                }
            });


            if (child.id == "Jyu_waza") {

                set_jyu_waza_dependent_widgets_state(child.checked);

                if (child.checked) {

                    // Disable and uncheck all techniques.
                    siblings.forEach(sibling => {
                        sibling.disabled = true;
                        sibling.checked = false;
                    });
    
                    // Enable and check 'Jyu waza'
                    child.disabled = false;
                    child.checked = true;

                } else {

                    // Enable and check all techniques.
                    siblings.forEach(sibling => {
                        sibling.disabled = false;
                        sibling.checked = true;
                    });

                    // Uncheck 'Jyu waza'
                    child.checked = false;

                    parent.checked = true;
                }

                all_parents_disabled = false;
            }

            document.getElementById('startBtn').disabled = all_parents_disabled;
        });
    });
}

/*
If 'jyu waza' mode is set, some widgets have to be disabled and set
to particular values.
The jyu_waza parameter is true if we are in jyu waza mode.
*/
function set_jyu_waza_dependent_widgets_state(jyu_waza) {

    const repetition_select = document.getElementById('repetition_select');
    let repetition_value = document.getElementById("repetition_value");

    if (jyu_waza) {
        repetition_select.value = 0;
        repetition_value.textContent = 0;

        document.getElementById('droite_gauche').checked = false;
        document.getElementById('aleatoire').checked = false;
    }

    repetition_select.disabled = jyu_waza;

    document.getElementById('kokyunage_select').disabled = jyu_waza;
    document.getElementById('droite_gauche').disabled = jyu_waza;
    document.getElementById('aleatoire').disabled = jyu_waza;

    document.getElementById('omote_ura').disabled = jyu_waza;
    document.getElementById('omote_ura').checked = !jyu_waza;
    document.getElementById('omote').disabled = jyu_waza;
    document.getElementById('ura').disabled = jyu_waza;
    document.getElementById('non_spec').disabled = jyu_waza;
    document.getElementById('non_spec').checked = jyu_waza;
}


function display_user_manual() {
    
    document.getElementById('startBtn').disabled = true;

    let text_area = document.getElementById('session_text_area');

    text_area.innerHTML = '<b>Activez le menu &#9961;</b><br><br>';
    text_area.innerHTML += '1 - Choisissez le grade préparé<br>';
    text_area.innerHTML += '2 - Choisissez une situation<br>';
    text_area.innerHTML += '3 - Choisissez <b>une</b> ou <b>toutes</b> les attaques<br>';
    text_area.innerHTML += '4 - Appuyez sur <b>Start</b><br><br>';

    text_area.innerHTML += "<b>Intervalle</b><br>temps d'éxécution autorisé par technique [3...15s]<br><br>";
    text_area.innerHTML += '<b>Répétitions</b><br>techniques redemandées plusieurs fois [0...5]<br><br>';
    text_area.innerHTML += '<b>Kokyu Nage</b><br>Nombre de Kokyu Nage à exécuter [1...8] (Dépend du grade)<br><br>';
    text_area.innerHTML += '<b>Droite & Gauche</b><br>techniques demandées avec exécution des deux côtés<br><br>';
    text_area.innerHTML += '<b>Aléatoire</b><br>techniques demandées dans un ordre aléatoire<br><br>';
    text_area.innerHTML += '<b>Omote / Ura</b><br>techniques demandées sous la forme choisie<br><br>';

    text_area.innerHTML += `<br><br><label style="font-size: 12px;">Version ${Version}</label>`;
}
