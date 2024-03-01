let messagesContainer = document.getElementById('messages');
messagesContainer.scrollTop = messagesContainer.scrollHeight;

const memberContainer = document.getElementById('members__container');
const memberButton = document.getElementById('members__button');

const chatContainer = document.getElementById('messages__container');
const chatButton = document.getElementById('chat__button');

let activeMemberContainer = false;

memberButton.addEventListener('click', () => {
  if (activeMemberContainer) {
    memberContainer.style.display = 'none';
  } else {
    memberContainer.style.display = 'block';
  }

  activeMemberContainer = !activeMemberContainer;
});

let activeChatContainer = false;

chatButton.addEventListener('click', () => {
  if (activeChatContainer) {
    chatContainer.style.display = 'none';
  } else {
    chatContainer.style.display = 'block';
  }

  activeChatContainer = !activeChatContainer;
});

let displayFrame = document.getElementById('stream__box');
let videoFrames = document.getElementsByClassName('video__container');
let userIdInDisplayFrame = null;

let expandVideoFrame = (e) => {
  // If the clicked video frame is already in the larger display frame
  let child = displayFrame.children[0];
  if (child) {
    // then return it down to the smaller video frames
    document.getElementById('streams__container').appendChild(child);
  }
  displayFrame.style.display = 'block';
  // and put the clicked video frame in the larger display frame
  displayFrame.appendChild(e.currentTarget);
  // and set the userIdInDisplayFrame to the id of the clicked video frame
  userIdInDisplayFrame = e.currentTarget.id;

  // Then make bottom video frames even smaller
  for (let i = 0; videoFrames.length > i; i++) {
    if (videoFrames[i].id !== userIdInDisplayFrame) {
      videoFrames[i].style.height = "100px";
      videoFrames[i].style.width = "100px";
    }
  }
}

for (let i = 0; videoFrames.length > i; i++) {
  videoFrames[i].addEventListener('click', expandVideoFrame);
}

let hideDisplayFrame = () => {
  userIdInDisplayFrame = null;
  displayFrame.style.display = null;

  // get user-container from the display frame
  let child = displayFrame.children[0];
  // then return it down to the smaller video frames
  document.getElementById('streams__container').appendChild(child);

  // Resize all the bottom video frames larger again
  let videoFrames = document.getElementsByClassName('video__container');
  for (let i = 0; videoFrames.length > i; i++) {
    videoFrames[i].style.height = "300px";
    videoFrames[i].style.width = "300px";
  }
}
displayFrame.addEventListener('click', hideDisplayFrame);