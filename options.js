function saveOptions(e) {
    browser.storage.sync.set({
        wordcount: document.querySelector('#wordcount').value,
    })
    document.getElementById('setting1').textContent = res.wordcount

    e.preventDefault()
}

function restoreOptions() {
    let gettingItem = browser.storage.sync.get('wordcount')
    gettingItem.then((res) => {
        console.log(res.wordcount)
        document.getElementById('setting1').textContent = res.wordcount
        document.querySelector('#wordcount').value = res.wordcount || 250
    })
}

document.addEventListener('DOMContentLoaded', restoreOptions)
document.querySelector('form').addEventListener('submit', saveOptions)
