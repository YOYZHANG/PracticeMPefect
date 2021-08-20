1. POP

```ts
type Pop<T extends any[]> = T extends [...arg: infer P, last: any] ? P : never;
```
https://github.com/type-challenges/type-challenges/blob/master/questions/16-medium-pop/README.md

2. Promise.all

```ts

declare function PromiseAll<T extends any[]>(values: readonly[...T]):
  Promise<{[key in keyof T]: T[key] extends Promise<infer I> ? I : T[key]}>
```

3. lookup
```ts
type LookUp<U, T extends string> = 
  U extends {'type': T} ? U : never;

```

4. trimLeft
```ts
type TrimLeft<S extends string> = S extends `${' ' | '\n' | '\t'}${infer R}`? TrimLeft<R> : S;
```

5. trim
```ts
type Trim<S extends string> = S extends `${' ' | '\n' | '\t'}${infer P}` 
  ? Trim<P>
  : S extends `${infer P}${' ' | '\n' | '\t'}`
    ? Trim<P>
    : S;


```
6. capitalize

```ts
type Capitalize<S extends string> = S extends `${infer P}${infer rest}` ? `${Uppercase<P>}${rest}` : S;
```

7. replace
```ts
type Replace<S extends string, From extends string, To extends string> = From extends '' ? S : S extends `${infer A}${From}${infer B}` ? `${A}${To}${B}` : S
```

8. replaceAll
```ts
type ReplaceAll<S extends string, From extends string, To extends string> = From extends '' ? S : S extends `${infer p}${From}${infer q}` ? `${p}${To}${ReplaceAll<q, From, To>}` : S;
```

9. lengthOfString
type LengthOfString<S extends string, R extends any[] = []>
  = S extends `${infer First}${infer Rest}`
    ? LengthOfString<Rest, [First, ...R]>
    : R["Length"]
    
10. Append to object
```ts
type AppendToObject<T extends object, U extends string, V> = {
  [K in keyof T | U]: K extends keyof T ? T[K] : V;
};
```

11.  absolute
```ts
type Absolute<T extends number | string | bigint> = T extends `${infer P}${infer Rest}`
  ? P extends '-'
    ? Rest
    : T
  : Absolute<`${T}`>
```

12. stringToUnion
  
  ```ts
  type StringToUnion<T extends string, Union = never> = T extends `${infer P}${infer U}`
  ? StringToUnion<U, Union | P>
  : Union
  ```

13. merge

```ts
type Merge<F, S> = {[K in keyof F]: K extends keyof S ? S[K] : F[K]}
```

14. CAMELCASE
```ts
type CamelCase<S> = S extends `${infer P}-${infer Q}${infer REST}`
  ? Q extends Uppercase<Q>
    ? `${P}-${CamelCase<`${Q}${REST}`>}` 
    :`${P}${Uppercase<Q>}${CamelCase<REST>}`
  : S
```

15. 如何声明类的ts
```ts
type ModuleConstructor = new () => unknown;

type ModuleConstructor = {new(): unknown};

class A {
  // constructor() {}
}

var haha: ModuleConstructor = A;
type cases = [
  Expect<Equal<ModuleConstructor, typeof haha>>
]
```
