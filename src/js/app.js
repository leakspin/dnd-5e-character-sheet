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
    }

    totalhd_clicked() {
        document.querySelector("[name='remaininghd']").value = document.querySelector("[name='totalhd']").value;
    }
}

window.app = new App();