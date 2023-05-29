import * as LC from 'vscode-languageclient/node';
import * as vscode from 'vscode';
import { pipe } from 'fp-ts/lib/function'
import {Either} from 'fp-ts/Either';
import * as E from 'fp-ts/Either';
import {Chan} from './util/chan';
import {pending} from './util/promise';
import * as Prom from './util/promise';

let GCLPATH = "/Users/geoffrsu/Library/Application Support/Code/User/globalStorage/scmlab.guabao/v0.3.11-macos/gcl";




//not decided yet
type Request = string;

//not decided yet
type Response = string;

// connection error
export type CError = CError.FromLSP;
namespace CError{
    export class FromLSP{
        error:Error;
        constructor(error:Error){
            this.error = error;
        }
    }
}

type LSPConnectionResult = Either<CError,null>;


type State = State.Disconnected | State.Connecting | State.Connected;
namespace State{
    export class Disconnected{}

    export class Connecting{
        readonly prom: Promise<LSPConnectionResult>;
        constructor(prom: Promise<LSPConnectionResult>){
            this.prom = prom;
        }
    }

    export class Connected{
        readonly client:LC.LanguageClient;
        readonly subscriptions: vscode.Disposable[];
        constructor
            ( client:LC.LanguageClient
            , subscriptions: vscode.Disposable[])
        {
            this.client = client;
            this.subscriptions = subscriptions;
        }
    }

    export const match = 
        <A>
        ( onDisconnected: () => A
        , onConnecting: (prom:Promise<LSPConnectionResult>) => A
        , onConnected: (client:LC.LanguageClient, subs:vscode.Disposable[]) => A
        ) => (st:State)
        : A =>
        st instanceof Connected? onConnected(st.client,st.subscriptions):
          st instanceof Connecting? onConnecting(st.prom): 
            onDisconnected();
}

let connectionState: State = new State.Disconnected();
let errorChan = new Chan<Error>();
let notificationChan = new Chan<Either<CError,Response>>();


export const start = ():Promise<LSPConnectionResult> =>
    State.match
        ( //onDisconnected
          ()=>{
            let [promise, resolve] = pending<LSPConnectionResult>();
            connectionState = new State.Connecting(promise);
            // let result:Promise<Either<CError, LSPConnection>> = 
            return pipe( makeLSPConnection()
                , Prom.mapLeft((e)=>new CError.FromLSP(e))
                ).then((connResult)=>{
                    //change state and stuff
                    return E.right(null);
                });
          }

          //onConnecting
        , (prom)=>prom

        //onConnected
        , (_client,_subs)=>Promise.resolve(E.right(null))
        )(connectionState);

export const stop = ():Promise<null> =>{

}
export const sendRequest = (req:Request):Promise<Either<CError,Response>> =>{

}
export const onNotification = 
    (callback:(_:Either<CError,Response>)=>void): vscode.Disposable =>{

}
export const onError = 
    (callback:(_:CError)=>void): vscode.Disposable =>{

}

class LSPConnection {
  client: LC.LanguageClient;
  id: string;
  name: string;
  errorChan: Chan<Error>;
  notificationChan: Chan<Object>;
  subscriptions:vscode.Disposable[];

  constructor
    ( client: LC.LanguageClient
    , id: string
    , name: string
    , errorChan: Chan<Error>
    , notificationChan: Chan<Object>
    , subscriptions: vscode.Disposable[]
    ){
    this.client = client;
    this.id = id;
    this.name = name;
    this.errorChan = errorChan;
    this.notificationChan = notificationChan;
    this.subscriptions = subscriptions;
  }

  onError(callback:(_:Error)=>void):vscode.Disposable{
    return new vscode.Disposable(this.errorChan.on(callback));
  }
  // !Not sure the exact type of the argument of the callback function, 
  //  was a JSON in our rescript version.
  onNotification(callback:(_:Object)=>void):vscode.Disposable{
    return new vscode.Disposable(this.notificationChan.on(callback));
  }
  sendNotification(data:any):Promise<any>{
    return this.client.onReady()
      .then(()=>this.client.sendNotification(this.id, data));
  }
  sendRequest(data:any):Promise<any>{
    return this.client.onReady()
      .then(()=>this.client.sendRequest(this.id,data));
  }
  // The type of the callback function is not decided yet.
  onRequest(callback:(_:any)=>Promise<any>):vscode.Disposable{
    return this.client.onRequest(this.id, callback);
  }
  destroy(){
    this.errorChan.destroy();
    this.notificationChan.destroy();
    this.subscriptions.forEach((x)=>x.dispose());
  }

}


export const makeLSPConnection = ():Promise<Either<Error,LSPConnection>> =>{
    let errorChan = new Chan<Error>();
    let id:string = "guabao";
    let name: string = "Guabao Language Server";
    let serverOptions: LC.Executable = {
        command:GCLPATH,
        args: []
    };
    let clientOption: LC.LanguageClientOptions = {
        documentSelector: [{ scheme: 'file', language: id }],
        synchronize: {
            // Notify the server about file changes to '.clientrc files contained in the workspace
            fileEvents: vscode.workspace.createFileSystemWatcher('**/.clientrc')
        },
        errorHandler: {
            error:(error:Error, msg:LC.Message, count:number):LC.ErrorAction =>{
                errorChan.emit(error);
                return LC.ErrorAction.Shutdown;
            },
            closed:()=>LC.CloseAction.DoNotRestart
        },
        //initializationOptions:null
    };
    let languageClient = new LC.LanguageClient(id, name, serverOptions, clientOption);

    let conn:LSPConnection = new LSPConnection(
        languageClient,
        id,
        name,
        errorChan,
        new Chan(),
        [languageClient.start()]
        );
    return Promise.race([ conn.client.onReady()
                        , conn.errorChan.once()
                        ])
                .then((res)=>{
                    if(typeof res === 'undefined'){
                        // Start listening for incoming notifications
                        let disp = conn.client.onNotification(conn.id, json => 
                            conn.notificationChan.emit(json));
                        conn.subscriptions.push(disp);
                        return E.right(conn);
                    }else{
                        return E.left(res);
                    }
                });
}