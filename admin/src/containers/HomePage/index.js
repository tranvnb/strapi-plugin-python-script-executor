/*
 *
 * HomePage
 *
 */

import React, { memo, useEffect, useState } from "react";
import pluginId from "../../pluginId";
import { request } from "strapi-helper-plugin";
import ScriptList from "../../components/ScriptList/index";
import ScriptConfig from "../../components/ScriptConfig/index";
import ScriptConsole from "../../components/ScriptConsole/index";
import { Wrapper } from "./Wrapper";
import ScriptContext from "../../contexts/scriptsContext";
import ModalContext from "../../contexts/modalContext";
import io from "socket.io-client";
import FromModal from "../FormModal";

const HomePage = () => {
  const [scripts, setScripts] = useState([]);
  const [socket, setSocket] = useState(null);
  const [consoleResult, setConsoleResult] = useState("");
  const [socketConnected, setSocketConnected] = useState(false);

  const [selectedId, setSelectedId] = useState(-1);

  const selectedScript = scripts.find((item) => item.id === selectedId);

  const [modal, setModal] = useState(false);
  const toggleModal = () => setModal(!modal);
  const submitFormModal = (data) => {
    return new Promise((resolve, reject) => {
      const response = request(`/${pluginId}/script`, {
        method: "POST",
        body: data,
      })
        .then(() => {
          strapi.notification.success("script was created.");
          resolve();
        })
        .catch((err) => {
          strapi.notification.error(`${err}`);
          reject(err);
        });
    });
  };

  const selectScript = (id) => {
    setSelectedId(id);
  };

  useEffect(() => {
    const response = request(`/${pluginId}/script`, {
      method: "GET",
    })
      .then((resp) => {
        if (resp.data && resp.data.length > 0) {
          setScripts(resp.data);
          setSelectedId(resp.data[0].id);
        }
      })
      .catch((err) => {
        strapi.notification.error(`${err}`);
      });
  }, []);

  useEffect(() => {
    setSocket(io(strapi.backendURL));
  }, []);

  useEffect(() => {
    if (!socket) return;
    socket.on("connect", () => {
      setSocketConnected(socket.connected);
    });
    socket.on("disconnect", () => {
      setSocketConnected(socket.connected);
    });

    socket.on("console", (data) => {
      setConsoleResult((prevValue) => {
        return prevValue + "\n" + data;
      });
    });
  }, [socket]);

  const executeCommand = (data) => {
    const resp = request(`/${pluginId}/script/run`, {
      method: "POST",
      body: {
        command: data.command,
        socketId: socket.id,
        params: data.params,
        id: data.id,
        isForceUpdate: data.isForceUpdate,
      },
    })
      .then((response) => {
        strapi.notification.success(
          `${response.message}` ?? "Command was executed."
        );
      })
      .catch((e) => {
        strapi.notification.error(`${e}`);
      });
  };

  return (
    <Wrapper>
      <ScriptContext.Provider value={{ selectedId, selectScript, socket }}>
        <ModalContext.Provider value={{ modal, toggleModal, submitFormModal }}>
          <div className="left-side-bar">
            <ScriptList scripts={scripts} />
          </div>
          <div className="main-content">
            <div className="config">
              {selectedId != -1 ? (
                <ScriptConfig
                  script={selectedScript}
                  executeCommand={executeCommand}
                />
              ) : (
                "No script is created. Go to Python script infos to create one."
              )}
            </div>
            <div className="console">
              {selectedId != -1 ? (
                <ScriptConsole
                  script={selectedScript}
                  consoleResult={consoleResult}
                />
              ) : (
                ""
              )}
            </div>
          </div>
          <FromModal />
        </ModalContext.Provider>
      </ScriptContext.Provider>
    </Wrapper>
  );
};

export default memo(HomePage);
