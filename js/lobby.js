let form = document.getElementById('lobby__form')

let displayName = localStorage.getItem('display_name')
if (displayName) {
    form.name.value = displayName
}

form.addEventListener('submit', (e) => {
    e.preventDefault()

    localStorage.setItem('display_name', e.target.name.value)

    let inviteCode = e.target.room.value
    if (!inviteCode) {
        inviteCode = String(Math.floor(Math.random() * 10000))
    }
    window.location = `room.html?room=${inviteCode}`
})


let queryString = window.location.search;
let urlParams = new URLSearchParams(queryString);
let error = urlParams.get('errorMessage');
if (error) {
    alert("Please enter a display name and room name to join the room.")
}
