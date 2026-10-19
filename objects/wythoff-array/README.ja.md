# ワイソフ配列

ワイソフ配列（Wythoff array）は、正の整数からなる無限行列です。すべての正の整数が配列中にちょうど一度現れ、各行はフィボナッチ型の漸化式を満たします。

## 定義

`φ = (1 + √5) / 2` とします。1から始まる行番号 `m` に対して `k = floor(mφ)` とし、行 `m` の最初の2項を `floor(kφ)`、`floor(kφ²)` と定義します。1から始まる列番号 `n >= 3` では `A(m,n) = A(m,n-2) + A(m,n-1)` とします。

JSONデータには、この無限配列の左上10 × 10の有限部分行列を保存しています。`rowIndexOrigin` と `columnIndexOrigin` はともに1で、内側の各配列が1行を表し、左から右へ列順に値を並べています。斜め読みした列ではなく、行と列の構造を保った抜粋です。

## 性質

各行の最初の2項はウィソフ対です。これらの対は、正の整数全体を重複なく分割します。その後ろの項は漸化式に従うため、各行はフィボナッチ型の数列になります。

## 参考文献

- [OEIS A035513: Wythoff array](https://oeis.org/A035513)
- [Wythoff array, Wikipedia](https://en.wikipedia.org/wiki/Wythoff_array)
- [Wythoff Array, Wolfram MathWorld](https://mathworld.wolfram.com/WythoffArray.html)
