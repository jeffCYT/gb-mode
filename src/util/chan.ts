import {EventEmitter} from 'eventemitter3';

export class Chan<T>{
    eventEmitter:EventEmitter;
    constructor(){
        this.eventEmitter  = new EventEmitter();
    }
    on(callback:(_:T)=>void){
        this.eventEmitter.on("data",callback);
        return ()=>this.eventEmitter.removeListener("data",callback);
    }
    emit(msg:T):boolean{
        return this.eventEmitter.emit("data",msg);
    }
    once():Promise<T>{
        return new Promise((resolve,reject)=>{
            this.eventEmitter.once("data",resolve);
        });
    }
    destroy(){
        this.eventEmitter.removeAllListeners();
    }
}
