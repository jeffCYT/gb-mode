import * as LC from 'vscode-languageclient/node';
import * as vscode from 'vscode';
import {Either} from 'fp-ts/Either';
import * as E from 'fp-ts/Either';
import {Chan} from './util/chan';

let PATH_EXISTS = true;
let GCLPATH = "/Users/geoffrsu/Library/Application Support/Code/User/globalStorage/scmlab.guabao/v0.3.11-macos/gcl";

export class Connection {
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


export const startConnection = ():Promise<Connection>=>{
    let errorChan: Chan<Error> = new Chan();
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
    let languageClient = new LC.LanguageClient(id, name, serverOptions, clientOption)

    let conn:Connection = new Connection(
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
                .then(()=>{
                // Start listening for incoming notifications
                let disp = conn.client.onNotification(conn.id, json => 
                    conn.notificationChan.emit(json));
                conn.subscriptions.push(disp);
                return conn;
                });
}