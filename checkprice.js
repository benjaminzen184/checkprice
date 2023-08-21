const ethers = require('ethers');
const moment = require('moment-timezone')
const config = require('./others/config.json');
const address = require('./others/address.json');


const provider = new ethers.providers.JsonRpcProvider(config.http);

const routerContract = new ethers.Contract(
    address.PANCAKE,
    [
        'function getAmountsOut(uint amountIn, address[] memory path) public view returns(uint[] memory amounts)'
    ],
    provider
    );
    
    
    async function checkPair(args) {
        const { amount, inputTokenAddress, outputTokenAddress, balAccount} = args
        
        const outputContract = new ethers.Contract(
            outputTokenAddress,
            [
                'function name() view returns (string)',
                'function decimals() view returns (uint)',
                'function symbol() view returns (string)',
                'function balanceOf(address) view returns (uint)',
            ],
            provider
            );
            
    //token symbols
    const outputSymbol = await outputContract.symbol()
    const outputName = await outputContract.name()
    const outputDecimalsB = await outputContract.decimals();
    const b = parseFloat(ethers.utils.formatUnits((await outputContract.balanceOf(config.publickey)),parseInt(outputDecimalsB)))

    //token decimals
    const outputDecimals = parseInt(outputDecimalsB)
    //ajust decimals price
    const inputAmountIn = ethers.utils.parseUnits('1', 18);
    const outputAmountIn = ethers.utils.parseUnits(amount, outputDecimals);

    let amountsInput = await routerContract.getAmountsOut(inputAmountIn, [address.WBNB, address.USDT]);
    if(!(inputTokenAddress==outputTokenAddress)){
        var amountsOutput = await routerContract.getAmountsOut(outputAmountIn, [outputTokenAddress, inputTokenAddress]);
    }

    const inputAmountOut = parseFloat(ethers.utils.formatEther(amountsInput[1]))
    if(!(inputTokenAddress==outputTokenAddress)){
        var outputAmountOut = parseFloat(ethers.utils.formatEther(amountsOutput[1]))
    }

    var price = 0
    var priceBNB = 0
    if(!(outputTokenAddress==inputTokenAddress)){
        price = inputAmountOut*outputAmountOut
        priceBNB = outputAmountOut
    }else{
        price = inputAmountOut*amount
        priceBNB = inputAmountOut/inputAmountOut
    }

    if(price<1){
        for (var p=0; p<18; p++) {
            if(price>Math.pow(10,-p)){
                var powprice = p
                p=19
            }
        }
    }
    if(priceBNB<1){
        for (var pb=0; pb<18; pb++) {
            if(priceBNB>Math.pow(10,-pb)){
                var powpriceBNB = pb
                pb=19
            }
        }
    }
    var  tokeninfo = {
        'ACCOUNT CASH': `${balAccount.toFixed(10)} BNB`,
        '------------------------': `------------------------------`,
        'Token': `${outputName} ( ${outputSymbol} )`,
        '-----------------------': `--------------------------`,
        'Price': `$${price.toFixed(powprice+3)} (${priceBNB.toFixed(powpriceBNB+3)} BNB)`,
    }
    var  tokeninfo1 = {
        'IN ACCOUNT': `${b.toFixed(3)} ${outputSymbol} = ~$${(b*price).toFixed(2)}`,
        '-----------------------------': `------------------------------`,
        'Amount buy': `${(amount/price).toFixed(3)} ${outputSymbol} = ~$${amount}`,
        '--------------------------': `--------------------------`,
        'Timestamp': `${moment().tz('America/Sao_Paulo').format()}`
    }
    console.table(tokeninfo)
    console.table(tokeninfo1)
}

async function checkprice(argsTwo){
    const { addr, amountbuy, balanceAccount} = argsTwo
    

    await checkPair({
        inputTokenAddress: address.WBNB, // fixed
        outputTokenAddress: addr, //This is the token you want
        amount: amountbuy, //the amount
        balAccount: parseFloat(balanceAccount), //This is the token you want
    })
}
// checkprice();
    
module.exports = checkprice
  
