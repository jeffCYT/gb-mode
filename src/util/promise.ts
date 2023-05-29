import * as E from 'fp-ts/Either';


export function makePromise<T>(executor: (resolve: (value: T) => void,
                                   reject: (reason?: any) => void) => void)
{
  return new Promise<T>(executor);
}

export const pending = <A>():[Promise<A>, (_:A | PromiseLike<A>)=>void] => {
  let f : (_:A|PromiseLike<A>)=>void;
  let res = (a:A|PromiseLike<A>):void => f(a);
  let prom:Promise<A> = new Promise((resolve,_reject)=>{
    f = resolve;
  });
  return [prom,res];
};

export const mapRight =
    <A,B,Err> 
        ( f:(_:A)=>B
        ) => (prom:Promise<E.Either<Err,A>>)
        : Promise<E.Either<Err,B>> => {
    return prom.then((either)=>{
        return E.match(
            (err:Err)=>E.left(err),
            (right:A)=>E.right(f(right))
        )(either);
    });
};

export const mapLeft =
    <ErrA,ErrB,T>
        ( f:(_:ErrA)=>ErrB
        ) => (prom:Promise<E.Either<ErrA,T>>)
        : Promise<E.Either<ErrB,T>> =>
    prom.then((result)=>
        E.match(
            (err:ErrA)=>E.left(f(err)),
            (right:T)=>E.right(right)
        )(result)
    );
        