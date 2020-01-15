class App {
    constructor() {
        let stats = document.getElementsByClassName('stat');
    
        for (let index = 0; index < stats.length; index++) {
            const elem = stats[index];
            elem.addEventListener('input', event => {
                let element = event.target;
                let inputName = element.name;
                let mod = parseInt(element.value) - 10;
        
                if (mod % 2 == 0) {
                    mod = mod / 2;
                } else {
                    mod = (mod - 1) / 2;
                }
            
                if (isNaN(mod)) {
                    mod = "";
                } else if (mod >= 0) {
                    mod = "+" + mod;
                }
        
                let scoreName = inputName.slice(0, inputName.indexOf("score"));
                let modName = scoreName + "mod";
        
                document.querySelector("[name='" + modName + "']").value = mod;
            });
        }
        
        document.querySelector('[name="classlevel"]').addEventListener('input', event => {
            let element = event.target;
            let classes = element.value;
            let r = new RegExp(/\d+/g);
            let total = 0;
            let result;
            let prof = 2
        
            while ((result = r.exec(classes)) != null) {
                let lvl = parseInt(result);
                if (!isNaN(lvl)) {
                    total += lvl;
                }
            }
            if (total > 0) {
                total -= 1;
                prof += Math.trunc(total/4);
                prof = "+" + prof;
            } else {
                prof = ""    
            }
            
            document.querySelector("[name='proficiencybonus']").value = prof;
        });
        
        document.querySelector("[name='totalhd']").addEventListener('input', this.totalhd_clicked);
        document.querySelector("[name='Strengthscore']").addEventListener('input', this.strengthskills);
        document.querySelector("[name='Wisdomscore']").addEventListener('input', this.wisdomskills);
        document.querySelector("[name='Intelligencescore']").addEventListener('input', this.intelligenceskills);
    }

    totalhd_clicked() {
        document.querySelector("[name='remaininghd']").value = document.querySelector("[name='totalhd']").value;
    }

    strengthskills() {
        document.querySelector("[name='Carryingcapacity']").value = parseInt(document.querySelector("[name='Strengthmod']").value) * 15;
        document.querySelector("[name='Maxweigth']").value = parseInt(document.querySelector("[name='Strengthmod']").value) * 30;
        document.querySelector("[name='Pushdrag']").value = parseInt(document.querySelector("[name='Strengthmod']").value) * 30;
    }

    wisdomskills() {
        document.querySelector("[name='passiveperception']").value = parseInt(document.querySelector("[name='Wisdommod']").value) + 10;
    }

    intelligenceskills() {
        document.querySelector("[name='passiveinvestigation']").value = parseInt(document.querySelector("[name='Intelligencemod']").value) + 10;
    }

    save() {
        let data = {};
        let template = document.querySelector('template#template-save-json').content.cloneNode(true);
        document.querySelectorAll('input, textarea').forEach(element => {
            data[element.name] = element.value;
        });
        template.querySelector('#json-save').value = JSON.stringify(data);
        document.querySelector('#popup-box').innerHTML = '';
        document.querySelector('#popup-box').append(template);
        document.querySelector('#popup').classList.remove('hide');
    }

    loadPopup() {
        let template = document.querySelector('template#template-load-json').content.cloneNode(true);
        document.querySelector('#popup-box').innerHTML = '';
        document.querySelector('#popup-box').append(template);
        document.querySelector('#popup').classList.remove('hide');
    }

    load() {
        let data = JSON.parse(document.querySelector('#json-load').value);
        for (const key in data) {
            if (data.hasOwnProperty(key)) {
                document.querySelector('[name="' + key + '"').value = data[key];
            }
        }
        this.closePopup();
    }

    closePopup() {
        document.querySelector('#popup').classList.add('hide');
        document.querySelector('#popup-box').innerHTML = '';
    }
}

window.app = new App();