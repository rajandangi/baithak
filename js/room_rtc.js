/**
 * The Agora App ID.
 * @type {string}
 */
const APP_ID = "d8e8f6686b274b7295dca23752b08db4"

/**
 * Unique identifier for the user.
 * @type {string}
 */
let uid = sessionStorage.getItem('uid')
if (!uid) {
    uid = String(Math.floor(Math.random() * 100000))
    sessionStorage.setItem('uid', uid)
}

let token = null;
let client;

let rtmClient;
let channel;

/**
 * Extracts the room ID from the URL parameters.
 */
let queryString = window.location.search;
let urlParams = new URLSearchParams(queryString);
let roomId = urlParams.get('room');
let displayName = localStorage.getItem('display_name')
// Redirect to the lobby if no room ID is present in the URL
if (!displayName || !roomId) {
    window.location = 'lobby.html?errorMessage=true'
}

let localTracks = [];
let remoteUsers = {};

let localScreenTracks;
let sharingScreen = false;

let joinRoomInit = async () => {
    rtmClient = await AgoraRTM.createInstance(APP_ID);
    await rtmClient.login({ uid, token });

    // Adds or updates the local user's attributes.
    await rtmClient.addOrUpdateLocalUserAttributes({ 'name': displayName })

    // Creates an RtmChannel instance
    channel = await rtmClient.createChannel(roomId);
    // Joins the channel.
    await channel.join();

    // Occurs when a remote user joins the channel.
    channel.on('MemberJoined', handleMemberJoined)
    // Occurs when a remote member leaves the channel.
    channel.on('MemberLeft', handleMemberLeft)
    // Occurs when the local user receives a channel message.
    channel.on('ChannelMessage', handleChannelMessage)

    getMembers();

    // Initialize the AgoraRTC client.
    client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
    await client.join(APP_ID, roomId, token, uid);

    //Occurs when a remote user publishes an audio or video track.
    client.on('user-published', handleUserPublished);
    // triggers this event when a remote user becomes offline.
    client.on('user-left', handleUserLeft);

    joinStream();
}

let joinStream = async () => {
    // https://api-ref.agora.io/en/video-sdk/web/4.x/interfaces/cameravideotrackinitconfig.html
    localTracks = await AgoraRTC.createMicrophoneAndCameraTracks({}, {
        encoderConfig: {
            width: { max: 640, ideal: 1920, max: 1920 },
            height: { max: 480, ideal: 1080, max: 1080 },
        }
    });

    let player = `<div class="video__container" id="user-container-${uid}">
                       <div class="video-player" id="user-${uid}"></div>
                    </div>`;

    document.getElementById('streams__container').insertAdjacentHTML('beforeend', player);
    document.getElementById(`user-container-${uid}`).addEventListener('click', expandVideoFrame);
    // NOTE: Audio Tracks in index 0 and Video Tracks in index 1 of localTracks
    // INFO: Add Video Stream to the div with id 'user-uid'
    localTracks[1].play(`user-${uid}`);
    await client.publish([localTracks[0], localTracks[1]]);
}

let switchToCamera = async () => {
    let player = `<div class="video__container" id="user-container-${uid}">
                    <div class="video-player" id="user-${uid}"></div>
                 </div>`
    displayFrame.insertAdjacentHTML('beforeend', player)

    await localTracks[0].setMuted(true)
    await localTracks[1].setMuted(true)

    document.getElementById('mic-btn').classList.remove('active')
    document.getElementById('screen-btn').classList.remove('active')

    localTracks[1].play(`user-${uid}`)
    await client.publish([localTracks[1]])
}


let handleUserPublished = async (user, mediaType) => {
    console.log('handle User Published triggered');
    remoteUsers[user.uid] = user;

    await client.subscribe(user, mediaType);
    let player = document.getElementById(`user-container-${user.uid}`);
    if (player === null) {
        player = `<div class="video__container" id="user-container-${user.uid}">
                       <div class="video-player" id="user-${user.uid}"></div>
                    </div>`;

        document.getElementById('streams__container').insertAdjacentHTML('beforeend', player);
        document.getElementById(`user-container-${user.uid}`).addEventListener('click', expandVideoFrame);
    }

    /**
     * INFO: if user is already in the top large display frame,
     *  then make sure newly remote added used on bottom frames are smaller.
     */
    if (displayFrame.style.display) {
        let videoFrame = document.getElementById(`user-container-${user.uid}`)
        videoFrame.style.height = '100px'
        videoFrame.style.width = '100px'
    }



    if (mediaType === 'video') {
        user.videoTrack.play(`user-${user.uid}`);
    }
    if (mediaType === 'audio') {
        user.audioTrack.play();
    }
}

let handleUserLeft = async (user) => {
    delete remoteUsers[user.uid];
    document.getElementById(`user-container-${user.uid}`).remove();

    // If the user who left was in the large display frame
    if (userIdInDisplayFrame === `user-container-${user.uid}`) {
        // then remove it from the large display frame
        displayFrame.style.display = 'none';
        // and set the userIdInDisplayFrame to null
        userIdInDisplayFrame = null;
        // and make all bottom video frames larger again
        let videoFrames = document.getElementsByClassName('video__container');
        for (let i = 0; videoFrames.length > i; i++) {
            videoFrames[i].style.height = "300px";
            videoFrames[i].style.width = "300px";
        }
    }
}
let toggleMic = async (e) => {
    let button = e.currentTarget

    // Turn on the camera
    if (localTracks[0].muted) {
        await localTracks[0].setMuted(false);
        button.classList.add('active');
    } else {
        // Turn off the camera
        await localTracks[0].setMuted(true);
        button.classList.remove('active');
    }
}

let toggleCamera = async (e) => {
    let button = e.currentTarget

    // Turn on the camera
    if (localTracks[1].muted) {
        await localTracks[1].setMuted(false);
        button.classList.add('active');
    } else {
        // Turn off the camera
        await localTracks[1].setMuted(true);
        button.classList.remove('active');
    }
}


let toggleScreenSharing = async (e) => {
    let screenButton = e.currentTarget;
    let cameraButton = document.getElementById('camera-btn');

    if (!sharingScreen) {
        sharingScreen = true;

        screenButton.classList.add('active');
        cameraButton.classList.remove('active');
        cameraButton.style.display = 'none'

        localScreenTracks = await AgoraRTC.createScreenVideoTrack();
        document.getElementById(`user-container-${uid}`).remove();
        displayFrame.style.display = 'block';

        let player = `<div class="video__container" id="user-container-${uid}">
                     <div class="video-player" id="user-${uid}"></div>
                </div>`;

        displayFrame.insertAdjacentHTML('beforeend', player);
        document.getElementById(`user-container-${uid}`).addEventListener('click', expandVideoFrame);
        userIdInDisplayFrame = `user-container-${uid}`;
        // INFO: Add Video Stream to the div with id 'user-xxx' (for user itself)
        localScreenTracks.play(`user-${uid}`);

        /**
         * INFO: unpublish the localTracks[1] (Current camera/video track) 
         * and publish the localScreenTracks (i.e. screen Share). 
         * So that remote users can see the screen share.
         */
        await client.unpublish([localTracks[1]]);
        await client.publish([localScreenTracks]);

        // Then make bottom video frames even smaller
        let videoFrames = document.getElementsByClassName('video__container');
        for (let i = 0; videoFrames.length > i; i++) {
            if (videoFrames[i].id !== userIdInDisplayFrame) {
                videoFrames[i].style.height = "100px";
                videoFrames[i].style.width = "100px";
            }
        }
    } else {
        sharingScreen = false;

        cameraButton.style.display = 'block';
        document.getElementById(`user-container-${uid}`).remove();

        await client.unpublish([localScreenTracks]);

        switchToCamera();
    }
}

// Button event listeners for toggling camera and microphone
document.getElementById('camera-btn').addEventListener('click', toggleCamera);
document.getElementById('mic-btn').addEventListener('click', toggleMic);
document.getElementById('screen-btn').addEventListener('click', toggleScreenSharing);

// Start the application
joinRoomInit();