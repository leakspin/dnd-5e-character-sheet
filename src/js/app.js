class App {
    constructor() {
        this.BASE_API_URL = 'https://dnd.adrianmora.dev/api/api.php';

        if (typeof sessionStorage['token'] != 'undefined') {
            this.callApi('GET', 'checkLogin', '', {} ,{}, true)
            .then(data => {
                if (data.status == 'OK') {
                    document.querySelector('#user').textContent = data.data.user;
                    app.charactersPopup();
                } else {
                    sessionStorage.removeItem('token');
                    app.loginPopup();
                }
            });
        } else {
            this.loginPopup();
        }

        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
              navigator.serviceWorker.register('/service-worker.js')
                  .then((reg) => {
                    console.log('Service worker registered.', reg);
                  });
            });
        }
    }

    goOffline() {
        alert('You are offline. If you reconnect without closing this window, the sheet will be automatically saved.');
        document.querySelector('#statusMessage').textContent = 'Offline, not saving';
    }

    goOnline() {
        this.save();
    }

    callApi(method, apiMethod, extraUrl = '', data = {}, headers = {}, useToken = false) {
        let fetchParams = {
            method: method,
            headers: {
                ...headers
            }
        };

        if (method == 'POST' || method == 'PUT') {
            fetchParams.headers['Content-Type'] = 'application/json';
            fetchParams.body = JSON.stringify(data);
        }

        if (useToken) {
            fetchParams.headers['X-User-Session'] = sessionStorage['token'];
        }

        return fetch(this.BASE_API_URL + '?method=' + apiMethod + extraUrl, fetchParams).then(res => {
            return res.json();
        });
    }

    loginPopup() {
        let template = document.querySelector('template#template-login').content.cloneNode(true);
        template.querySelector('input[name="pass"]').addEventListener('keypress', e => {
            if (e.key === 'Enter') {
                app.login();
            }
        });
        document.querySelector('#popup-box').innerHTML = '';
        document.querySelector('#popup-box').append(template);
        this.openPopup();
    }

    registerPopup() {
        let template = document.querySelector('template#template-register').content.cloneNode(true);
        document.querySelector('#popup-box').innerHTML = '';
        document.querySelector('#popup-box').append(template);
        this.openPopup();
    }

    login() {
        this.callApi('POST', 'login', '', {
            user: document.querySelector('#popup-box input[name="user"]').value,
            pass: document.querySelector('#popup-box input[name="pass"]').value
        })
        .then(data => {
            if (data.status == 'OK') {
                sessionStorage['token'] = data.data.session;
                document.querySelector('#user').textContent = data.data.user;
                app.charactersPopup();
            } else {
                document.querySelector('#popup-box #login-message').textContent = data.message;
            }
        });
    }

    register() {
        if (document.querySelector('#popup-box input[name="pass"]').value == document.querySelector('#popup-box input[name="passconf"]').value) {
            this.callApi('POST', 'register', '', {
                user: document.querySelector('#popup-box input[name="user"]').value,
                pass: document.querySelector('#popup-box input[name="pass"]').value
            }).then(data => {
                if (data.status == 'OK') {
                    app.loginPopup();
                    document.querySelector('#popup-box #login-message').textContent = data.message;
                } else {
                    document.querySelector('#popup-box #register-message').textContent = data.message;
                }
            });
        } else {
            document.querySelector('#popup-box #register-message').textContent = "Passwords don't match";
        }
    }

    charactersPopup() {
        let template = document.querySelector('template#template-characters').content.cloneNode(true);

        app.callApi('GET', 'getCharacters', '', {}, {}, true)
        .then(data => {
            if (data.status == 'OK') {
                let characters = template.querySelector('#characters');
                data.data.forEach(character => {
                    let node = document.createElement('div');
                    let name = document.createElement('div');
                    let del = document.createElement('div');
                    node.classList.add('center');
                    name.addEventListener('click', app.loadCharacter);
                    del.addEventListener('click', app.deleteCharacter);
                    name.classList.add('button');
                    name.classList.add('charname');
                    del.classList.add('button');
                    del.classList.add('deletechar');
                    node.dataset['charId'] = character.id;
                    name.textContent = character.name;
                    del.textContent = 'X';
                    node.appendChild(name);
                    node.appendChild(del);
                    characters.append(node);
                });
                document.querySelector('#popup-box').innerHTML = '';
                document.querySelector('#popup-box').append(template);
                app.openPopup();
            }
        });
    }

    newCharacter() {
        this.closePopup();
        this.initSheet();
    }

    loadCharacter(event) {
        let element = event.target.parentNode;
        let id = element.dataset.charId;
        app.callApi('GET', 'getCharacter', '&id=' + id, {}, {}, true)
        .then(data => {
            app.loadData(JSON.parse(data.data.data));

            let charId = document.querySelector('input[name="characterId]');
            if (charId) {
                charId.remove();
            }

            app.inputCharacterId(document.querySelector('form'), data.data.id, data.data.datetime);

            app.initSheet();
            app.closePopup();
        });
    }

    deleteCharacter() {
        let element = event.target.parentNode;
        let name = element.querySelector('.charname').textContent;
        let id = element.dataset.charId;
        if (confirm('Are you sure to remove character "' + name + '"?')) {
            app.callApi('DELETE', 'deleteCharacter', '&id=' + id, {}, {}, true)
            .then(app.charactersPopup);
        }
    }

    inputCharacterId(body, id, lastSavedDate) {
        let elem = body.querySelector('input[name="characterId"]');
        if (elem) {
            elem.value = id;
        } else {
            let charId = document.createElement('input');
            charId.name = 'characterId';
            charId.type = 'hidden';
            charId.value = id;
            body.appendChild(charId);
        }

        elem = body.querySelector('input[name="lastSavedDate"]');
        if (elem) {
            elem.value = lastSavedDate;
        } else {
            let lastSavedDateElem = document.createElement('input');
            lastSavedDateElem.name = 'lastSavedDate';
            lastSavedDateElem.type = 'hidden';
            lastSavedDateElem.value = lastSavedDate;
            body.appendChild(lastSavedDateElem);
        }
    }

    initSheet() {
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
        document.querySelectorAll('.edit').forEach(elem => {
            elem.addEventListener('click', app.showDetail);
        });

        let expertises = document.getElementsByClassName('expertise');

        for (let index = 0; index < expertises.length; index++) {
            const elem = expertises[index];
            elem.addEventListener('click', (e) => {
                if (!e.target.checked && e.target.value != 2) {
                    e.preventDefault();
                    e.target.value = 2;
                } else if (e.target.checked && e.target.value == 2) {
                    e.target.value = undefined;
                }
            });
        }
        
        document.querySelector('form.charsheet').addEventListener('click', () => {
            if (!document.querySelector('#menu-content').classList.contains('hide')) {
                app.closeMenu();
            }
        });

        window.addEventListener('online',  this.goOnline);
        window.addEventListener('offline', this.goOffline);
        window.addEventListener('beforeunload', (e) => {
            let actualData = app.getCharData();
            if (JSON.stringify(actualData) != JSON.stringify(app.prevData)) {
                let msg = 'You have unsaved data. Leaving the page will restore the data to the previous changes. Are you sure to leave?';
                (e || window.event).returnValue = msg;
                return msg;
            }
        });

        app.prevData = app.getCharData();
        app.preventSaving = false;
        app.isSaving = false;

        setInterval(app.save, 5000);
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

    getCharData() {
        let data = {};
        document.querySelectorAll('input, textarea').forEach(element => {
            if (element.type == 'checkbox') {
                if (element.classList.contains('expertise')) {
                    data[element.name] = element.value == 2 ? element.value : element.checked;
                } else {
                    data[element.name] = element.checked;
                }
            } else {
                data[element.name] = element.value;
            }
        });
        return data;
    }

    showDetail(event) {
        let element = event.target;
        let name = element.dataset.name;
        let template = document.querySelector('template#template-see-field').content.cloneNode(true);
        template.querySelector('#field').value = document.querySelector('input[name="' + name + '"]').value;
        template.querySelector('#field').dataset.name = name;
        document.querySelector('#popup-box').innerHTML = '';
        document.querySelector('#popup-box').append(template);
        app.openPopup();
    }

    editField() {
        let field = document.querySelector('#popup-box #field');
        document.querySelector('input[name="' + field.dataset.name + '"]').value = field.value;
        this.closePopup();
    }

    export() {
        let template = document.querySelector('template#template-export-json').content.cloneNode(true);
        template.querySelector('#json-export').value = JSON.stringify(this.getCharData());
        document.querySelector('#popup-box').innerHTML = '';
        document.querySelector('#popup-box').append(template);
        this.openPopup();
    }

    importPopup() {
        let template = document.querySelector('template#template-import-json').content.cloneNode(true);
        document.querySelector('#popup-box').innerHTML = '';
        document.querySelector('#popup-box').append(template);
        this.openPopup();
    }

    import() {
        let data = JSON.parse(document.querySelector('#json-import').value);
        this.loadData(data);
        this.closePopup();
    }

    save(force = false, preventSaving = false) {
        if (!app.isSaving) {
            app.isSaving = true;
            if (navigator.onLine) {
                if (!app.preventSaving || preventSaving) {
                    document.querySelector('#statusMessage').textContent = 'Saving...';
                    let data = app.getCharData();
                    if (force) {
                        data.force = true;
                    }
                    app.callApi('POST', 'saveCharacter', '', data, {}, true)
                    .then(data => {
                        if (data.status == 'OK') {
                            document.querySelector('#statusMessage').textContent = 'Saved';
                            app.inputCharacterId(document.querySelector('form'), data.data.id, data.data.datetime);
                            app.prevData = app.getCharData();
                        } else {
                            document.querySelector('#statusMessage').textContent = 'Error saving';
                            if (data.message == 'Character already saved with a future date, must overwrite.') {
                                if (confirm("There's new data saved in the database, different from here. Would you like to overwrite it?")) {
                                    app.isSaving = false;
                                    app.save(true, true);
                                    app.preventSaving = false;
                                } else {
                                    app.preventSaving = true;
                                    document.querySelector('#statusMessage').textContent = 'Not saving automatically';
                                }
                            }
                            console.error(data.message);
                        }

                        app.isSaving = false;
                    });
                } else {
                    document.querySelector('#statusMessage').textContent = 'Not saving automatically';
                }
            } else {
                document.querySelector('#statusMessage').textContent = 'Offline, not saving';
            }
        }
    }

    loadData(data) {
        document.querySelectorAll('input, textarea').forEach(element => {
            if (element.type == 'checkbox') {
                if (element.classList.contains('expertise')) {
                    if (data.hasOwnProperty(element.name) && data[element.name] == 2) {
                        element.value = data[element.name];
                    }

                    element.checked = data.hasOwnProperty(element.name) ? data[element.name] : false;
                } else {
                    element.checked = data.hasOwnProperty(element.name) ? data[element.name] : false;
                }
            } else {
                element.value = data.hasOwnProperty(element.name) ? data[element.name] : '';
            }
        });
    }

    openMenu() {
        document.querySelector('#menu-icon').classList.add('hide');
        document.querySelector('#menu-content').classList.remove('hide');
    }

    closeMenu() {
        document.querySelector('#menu-icon').classList.remove('hide');
        document.querySelector('#menu-content').classList.add('hide');
    }

    goTo(selector) {
        document.querySelector(selector).scrollIntoView({behavior: "auto", block: "start"});
        app.closeMenu();
    }

    logout() {
        sessionStorage.removeItem('token');
        location.reload();
    }

    openPopup() {
        document.querySelector('#popup').classList.remove('hide');
        document.querySelector('#popup-background').classList.remove('hide');
        document.body.style.overflow = 'hidden';
    }

    closePopup() {
        document.querySelector('#popup').classList.add('hide');
        document.querySelector('#popup-background').classList.add('hide');
        document.querySelector('#popup-box').innerHTML = '';
        document.body.style.overflow = 'initial';
    }
}

window.app = new App();
