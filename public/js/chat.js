const socket = io();

//Elements
const $messageForm = document.querySelector("#sendMsg");
const $messageFormInput = $messageForm.querySelector("input");
const $messageFormButton = $messageForm.querySelector("button");
const $locationFormButton = document.querySelector("#sendLocation");
const $messages = document.querySelector("#messages");

//Templates
const messageTemplate = document.querySelector("#messageTemplate").innerHTML;
const locationTemplate = document.querySelector("#locationTemplate").innerHTML;
const sidebarTemplate=document.querySelector('#sidebar-template').innerHTML

//Options
const {username,room}= Qs.parse(location.search, { ignoreQueryPrefix:true})

const autoScroll=()=>{
    //new message element
    const $newMessage=$messages.lastElementChild

    //Height of new message
    const newMessageStyles=getComputedStyle($newMessage)
    const newMessageMargin=parseInt(newMessageStyles.marginBottom)
    const newMessageHeight=$newMessage.offsetHeight + newMessageMargin

    //Visible height
    const visibleHeight=$messages.offsetHeight
    //Height of messages container
    const containerHeight=$messages.scrollHeight

    //how far have i scrolled
    const scrollOffset=$messages.scrollTop + visibleHeight

    if(Math.round(containerHeight - newMessageHeight - 1) <= Math.round(scrollOffset)){
        $messages.scrollTop = $messages.scrollHeight;
    }
}

socket.on("message", message => {
  console.log(message);
  const html = Mustache.render(messageTemplate, {
    username:message.username,  
    message: message.text,
    createdAt: moment(message.createdAt).format("h:mm a")
  });
  $messages.insertAdjacentHTML("beforeend", html);
  autoScroll()
});

socket.on("locationMessage", message => {
  const html = Mustache.render(locationTemplate, {
    username:message.username,
    url: message.url,
    createdAt: moment(message.createdAt).format("h:mm a")
  });
  $messages.insertAdjacentHTML("beforeend", html);
  autoScroll()
});

socket.on('roomData',({room,users})=>{
    const html=Mustache.render(sidebarTemplate,{
        room,
        users
    })
    document.querySelector('#sidebar').innerHTML=html
})

$messageForm.addEventListener("submit", e => {
  e.preventDefault();
  //disable message
  $messageFormButton.setAttribute("disabled", "disabled");

  const message = e.target.elements.message.value;
  socket.emit("sendMessage", message, error => {
    //enable message
    $messageFormButton.removeAttribute("disabled");
    $messageFormInput.value = "";
    $messageFormInput.focus();
    if (error) {
      return console.log(error);
    }
    console.log("Message delivered!");
  });
});

$locationFormButton.addEventListener("click", () => {
  if (!navigator.geolocation) {
    return alert("Geolocation is not supported by your browser.");
  }
  $locationFormButton.setAttribute("disabled", "disabled");
  navigator.geolocation.getCurrentPosition(position => {
    const lat = position.coords.latitude;
    const long = position.coords.longitude;
    socket.emit(
      "location",
      {
        lat,
        long
      },
      error => {
        $locationFormButton.removeAttribute("disabled");
        if (error) {
          return console.log(error);
        }
        console.log("Location shared!");
      }
    );
  });
});

socket.emit('join',{username,room},(error)=>{
    if(error){
        alert(error)
        location.href='/'
    }
})