"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import socket from "./components/connect";

export default function Home() {
  const [user, setUsername] = useState("");
  const [takenName, setTakenName] = useState(true);
  const [roomName, setRoomName] = useState("");
  const router = useRouter();

  function userjoin() {  //triggers when someone click on join button
    if (user && roomName) {                 //if the user or room name is not present the func wwill not do anything
      socket.emit("check-user", { user });  //emit to server to check in the database if the username is already present
      socket.on("approved-user", () => { 
        console.log("1");   //if username is not present on the server database
        router.push(`/Chatroom?user=${user}&room=${roomName}`);
      });
      socket.on("duplicate-user", (m) => {  //if the user is present at server databse  takennaem state will cahnge and will give the notification
        setTakenName(`username ${m.user} is taken`);
      });
    }
  }

  return (
    <>
      <div className="flex flex-col items-center justify-center h-screen bg-accent">
        <div className="flex flex-col justify-center items-center m-auto  border-2  bg-background">
          <input
            className="flex p-2 m-2 rounded-xl shadow-md "
            placeholder="username"
            value={user}
            onChange={(e) => setUsername(e.target.value)}
          />

          <input
            className="p-2 m-2 shadow-md rounded-xl  "
            placeholder="Room name"
            value={roomName}
            onChange={(e) => setRoomName(e.target.value)}
          />
          {!takenName ? "" : <span className="p-2 text-wrap">{takenName}</span>}

          <button
            className="p-4 m-2 bg-joinbutton hover:bg-joinbutton2  border-b-4 border-joinbutton2 border-l-green-700 rounded-[25px] shadow-md"
            onClick={() => userjoin()}
          >
            Join
          </button>
        </div>
      </div>
    </>
  );
}
