export default {
  id:'linear-equations',title:'One-Variable Linear Equations',
  questions:[
    ['add','Solve: x + 7 = 12',['5','19','−5','7'],0,'Subtract 7 from both sides: x = 5.'],
    ['subtract','Solve: x − 4 = 9',['5','13','−13','36'],1,'Add 4 to both sides: x = 13.'],
    ['multiply','Solve: 3x = 18',['15','21','6','54'],2,'Divide both sides by 3: x = 6.'],
    ['divide','Solve: x ÷ 5 = 4',['9','1','20 ÷ 5','20'],3,'Multiply both sides by 5: x = 20.'],
    ['two-step','Solve: 2x + 3 = 11',['4','7','8','−4'],0,'Subtract 3, then divide by 2: x = 4.'],
    ['two-subtract','Solve: 5x − 6 = 14',['2','4','8','20'],1,'Add 6 to get 5x = 20, then divide by 5.'],
    ['negative','Solve: −3x = 12',['4','−9','−4','9'],2,'Divide both sides by −3: x = −4.'],
    ['fraction','Solve: x/4 + 2 = 5',['3','7','8','12'],3,'Subtract 2 to get x/4 = 3, then multiply by 4.'],
    ['distribution','Solve: 2(x + 3) = 14',['4','10','7','−4'],0,'Divide by 2 to get x + 3 = 7, then subtract 3.'],
    ['both-sides','Solve: 3x + 2 = x + 10',['2','4','6','8'],1,'Subtract x and 2 from both sides: 2x = 8, so x = 4.'],
    ['decimal','Solve: 0.5x = 6',['3','6.5','12','5.5'],2,'Divide 6 by 0.5: x = 12.'],
    ['negative-add','Solve: x + 8 = 3',['11','5','−11','−5'],3,'Subtract 8 from both sides: x = −5.'],
    ['inverse','Which operation undoes multiplication by 6?',['Division by 6','Addition of 6','Subtraction of 6','Multiplication by −6'],0,'Multiplication and division by the same nonzero number are inverse operations.'],
    ['balance','Why must an operation be applied to both sides of an equation?',['To make every answer positive','To preserve equality','To remove all variables immediately','To make both sides larger'],1,'Applying the same valid operation to both sides keeps them equal.'],
    ['check','Which value satisfies 4x − 1 = 11?',['2','4','3','5'],2,'Substitute 3: 4(3) − 1 = 11.'],
    ['like-terms','Solve: 2x + 3x = 25',['10','25','3','5'],3,'Combine like terms to get 5x = 25, then divide by 5.'],
    ['none','How many solutions does x + 2 = x + 5 have?',['No solutions','Exactly one','Exactly two','Infinitely many'],0,'Subtracting x gives 2 = 5, which is false for every value of x.'],
    ['infinite','How many solutions does 2(x + 1) = 2x + 2 have?',['No solutions','Infinitely many','Exactly one','Exactly two'],1,'Both sides simplify to 2x + 2, so every real value of x satisfies the equation.'],
    ['word','A notebook costs $3. You spend $15 on identical notebooks. Which equation finds the number n bought?',['n + 3 = 15','15n = 3','3n = 15','n − 3 = 15'],2,'Total cost equals price per notebook multiplied by the number bought: 3n = 15.'],
    ['parentheses','Solve: 3(x − 2) = 9',['1','3','7','5'],3,'Divide by 3 to get x − 2 = 3, then add 2.']
  ].map(([id,question,choices,answer,explanation])=>({id,question,choices,answer,explanation}))
};
