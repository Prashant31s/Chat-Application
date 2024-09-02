"use client";
import React, { useEffect, useState } from "react";
import socket from "../components/connect";
import { useRouter, useSearchParams } from "next/navigation";
import { createBrowserHistory } from "history";

function Chatroom() {
  const [data, setData] = useState([]);
  const [message, setMessage] = useState("");
  const [socketID, setSocketID] = useState("");
  const searchParams = useSearchParams();
  const router = useRouter();
  const user = searchParams.get("user");
  const history = createBrowserHistory();
  const [allow, setAllow] = useState(false);
  const room = searchParams.get("room");
  const [activeDropdown, setActiveDropdown] = useState(null);

  const handleSubmit = (e) => {
    //triggers when send button is licked
    e.preventDefault();
    if (message) {
      socket.emit("message", { message, room, user });
    }
    setMessage("");
  };

  const handleEdit = (messageId, currentContent) => {
    //triggers when message edit button is clicked
    const newContent = prompt("Edit your message:", currentContent);
    if (newContent) {
      socket.emit("edit-message", { messageId, newContent, room: room });
    }
    setActiveDropdown(null);
  };

  const handleDelete = (messageId) => {
    //triggers when message delete button is clicked
    socket.emit("delete-message", { messageId, room: room });
    setActiveDropdown(null);
  };

  useEffect(() => {
    history.listen((update) => {
      //triggers when browser back button is clicked
      if (update.action === "POP") {
        socket.emit("back-button-leave", socket.id);
      }
    });
  }, [history]);

  useEffect(() => {
    socket.emit("username", { user });
    socket.on("duplicate username", () => {
      // if someone enters the room by accesing link and in link the username is duplicate then he will be pushed to the homepage
      router.push(`/`);
      setAllow(false);
    });

    socket.on("approved username", () => {
      // if someone enters the room by accesing link and in link the username is not duplicate he will be allowed to join room
      setAllow(true);
    });
    return () => {
      socket.off("duplicate username");
      socket.off("approved username");
    };
  }, [user, router]);

  useEffect(() => {
    if (!allow) {
      return;
    }
    setSocketID(socket.id);
    socket.on("connect", () => {
      setSocketID(socket.id);
    });
    socket.emit("join-room", room);
    socket.on("history", (messages) => {
      //gets the history of room from server and put it in the state to display in ui
      let mes = messages.map((msg) => ({
        id: msg._id,
        nmessages: msg.message,
        ruser: msg.user,
      }));
      setData(mes);
      console.log("daaaaata", messages);
    });
  }, [allow]);

  useEffect(() => {
    if (!allow) {
      return;
    }
    socket.on("receive-message", ({ message, user, _id }) => {
      setData((prevData) => [
        ...prevData,
        { id: _id, nmessages: message, ruser: user }, //adds the message received in state
      ]);
    });

    socket.on("message-edited", ({ messageId, newContent }) => {
      setData((prevData) =>
        prevData.map(
          (msg) =>
            msg.id === messageId ? { ...msg, nmessages: newContent } : msg //make the edits in message in the state
        )
      );
    });

    socket.on("message-deleted", ({ messageId }) => {
      setData(
        (prevData) => prevData.filter((msg) => msg.id !== messageId) //remove the deleted message from the state
      );
    });

    return () => {
      socket.off("receive-message");
      socket.off("message-edited");
      socket.off("message-deleted");
    };
  }, [data, allow]);

  const toggleDropdown = (messageId) => {
    setActiveDropdown(activeDropdown === messageId ? null : messageId);
  };

  return (
    <div className="w-screen bg-accent h-screen">
      <div className="rounded-2xl items-center justify-center text-center text-2xl">
        <h1 className="p-2 m-1 text-heading">{user}</h1>

        <div className="flex flex-col justify-end border-[2.5px] border-white rounded-[30px] bg-black w-[50vw] min-w-[750px] h-[90vh] mx-auto my-4 bg-background">
          <div className="flex flex-col-reverse p-3 mt-5 mr-2 overflow-auto scrollbar-thin scrollbar-thumb-rounded-sm scrollbar-thumb-black">
            <div className="flex flex-col gap-3 p-2">
              {data.map((msg, index) =>
                msg.ruser === user ? (
                  <div
                    key={index}
                    className="relative bg-primary flex flex-row self-end max-w-xs border-[1px] border-black rounded-[25px] p-1"
                  >
                    <p className="text-wrap m-1 word overflow-x-auto">
                      {msg.nmessages}
                    </p>
                    <button
                      onClick={() => toggleDropdown(msg.id)}
                      className="mr-[10px] text-xl"
                    >
                      ⋮
                    </button>
                    {activeDropdown === msg.id && (
                      <div className=" absolute right-full top-0 bg-white border rounded shadow-lg z-10 text-xs  mr-[5px] my-1">
                        <button
                          onClick={() => {
                            handleEdit(msg.id, msg.nmessages);
                          }}
                          className="block py-[3px] text-black hover:bg-secondary rounded-[3px] w-14"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => {
                            handleDelete(msg.id);
                          }}
                          className="block  py-[3px] text-red-500 hover:bg-red rounded-[3px] w-14"
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div
                    key={index}
                    className="bg-secondary flex flex-col max-w-xs border-[1px] border-text rounded-[25px] w-fit"
                  >
                    {msg.ruser === data[index - 1 > 0 ? index - 1 : 0].ruser && //functionality to not give every message with user if the last message is from same user
                    index != 0 ? (
                      <span className="m-0.5 bg-secondary pl-1 pr-1  text-black rounded-2xl text-wrap word overflow-x-auto ">
                        {msg.nmessages}
                      </span>
                    ) : (
                      <div className="flex flex-col">
                        <span
                          className={`pt-1 pl-1 pr-1  mt-0 text-[20px] font-bold text-black `}
                        >
                          {msg.ruser} :
                        </span>
                        <span className=" mb-[2px] pl-1 pr-1 pb-1 text-black rounded-xl text-wrap word overflow-x-auto ">
                          {msg.nmessages}
                        </span>
                      </div>
                    )}
                  </div>
                )
              )}
            </div>
          </div>

          <form className="form" onSubmit={handleSubmit}>
            <input
              type="text"
              placeholder="Enter message"
              className="input"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
            <button type="submit" className="">
              Send
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Chatroom;
