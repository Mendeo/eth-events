﻿/*
	Copyright © 2020 Aleksandr Menyaylo (Александр Меняйло)

    This file is part of "eth-events".

    "eth-events" is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    "eth-events" is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with "eth-events". If not, see <https://www.gnu.org/licenses/>.
*/
'use strict';
const _provider = window['ethereum'];
let _contractAddress;
let _contractAbi;
const _bgDiv = document.getElementById('bgDiv'); //Белый фон в центре.

//Зполняем белым фоном центр.
function fillBg()
{
	_bgDiv.style.height = document.documentElement.clientHeight + 'px';
}
fillBg();
window.addEventListener('resize', fillBg);
/***************************/

//Отображаем описание
const APP_PATH = window.location.pathname;
const DEFAULT_LANG = 'en-US'
const _lang = navigator.browserLanguage || navigator.language || navigator.userLanguage || DEFAULT_LANG;
let _interfaceLang;
let _infoLang;

start();

async function start()
{
	_interfaceLang = await fetchLang('lang.json', false);
	_infoLang = await fetchLang('info.html', true);
	onTranslationLoad();
}

async function fetchLang(fileName, isText)
{
	let res = await fetch(`${APP_PATH}/lang/${_lang}/${fileName}`);
	if (!res.ok) res = await fetch(`${APP_PATH}/lang/${DEFAULT_LANG}/${fileName}`);
	let type = isText ? res.text : res.json;
	return res.ok ? await type.call(res) : false;
}

function onTranslationLoad()
{
	//Проверка на наличе MetaMask
	if (typeof window.ethereum !== 'undefined')
	{
		const info = document.getElementById('info');
		info.hidden = false;
		info.innerHTML = _infoLang;
		const connectBt = document.getElementById('connectBt');
		connectBt.innerHTML = _interfaceLang.connectBt;
		connectBt.addEventListener('click', () =>
			{
				_provider.enable().then(onConnect).catch(console.log);
				connectBt.hidden = true;
				info.hidden = true;
			});
		_provider.on('chainChanged', () => document.location.reload());
		_provider.autoRefreshOnNetworkChange = false;
	}
	else
	{
		const msg = _interfaceLang.noProviderError;
		alert(msg);
		const msgEl = document.createElement('h4');
		msgEl.style="margin-top: 50px; color: red; text-align: center";
		msgEl.innerHTML = msg;
		_info.append(msgEl);
		connectBt.hidden = true;
	}
}

function onConnect(accounts)
{
	const account = accounts[0];
	const userState = document.getElementById('connectionInfo');
	userState.innerHTML = `${_interfaceLang.accountLb}: ${account}<br/>`;
	//Вводим входные данные.
	const inputDiv = document.getElementById('inputData');
	inputDiv.hidden = false;
	const contractAddress = document.getElementById('contractAddress'); //Поле ввода адреса
	const contractAddressInHeader = document.getElementById('contractAddressInHeader'); //Заголовок поля ввода адреса
	contractAddressInHeader.innerHTML = _interfaceLang.contractAddressIn;
	const contractAbi = document.getElementById('contractAbi'); //Поле ввода ABI
	const contractAbiInHeader = document.getElementById('contractAbiInHeader'); //Заголовок поля ввода ABI
	contractAbiInHeader.innerHTML = _interfaceLang.contractAbiIn;
	const startListenBt = document.getElementById('startListenBt'); //Кнопка пуск
	startListenBt.innerHTML = _interfaceLang.startListenBt;
	startListenBt.addEventListener('click', () =>
		{
			_contractAddress = contractAddress.value;
			_contractAbi = contractAbi.value;
			document.getElementById('contractAddressLb').textContent = _interfaceLang.contractAddressLb + ': ' + _contractAddress;
			inputDiv.hidden = true;
			onContractInput();
		});
}

function onContractInput()
{
	const web3 = new Web3(Web3.givenProvider);
	const contract = new web3.eth.Contract(JSON.parse(_contractAbi), _contractAddress);
	const clearEventsBt = document.getElementById('clearEvents');
	clearEventsBt.innerHTML = _interfaceLang.clearListBt;
	const pauseResumeBt = document.getElementById('pauseResumeBt');
	pauseResumeBt.innerHTML = _interfaceLang.pauseBt;
	const eventsList = [];
	const eventsHolder = document.getElementById('events');
	const scrollToDiv = document.getElementById('scrollToDiv');
	let isPaused = false;
	//Для тестирования.
	//let testEl = document.createElement('li');
	//testEl.innerHTML = `${new Date().toString()} тестирование вывода.`;
	//eventsHolder.append(testEl);
	//Конец тестирования.
	contract.events.allEvents((err, event) =>
		{
			if (!isPaused)
			{
				if (err)
				{
					console.log(err);
				}
				else
				{
					//console.log(event);
					clearEventsBt.hidden = false;
					pauseResumeBt.hidden = false;
					let el = document.createElement('li')
					eventsList.push(el);
					let d = new Date();					
					let dateOptions =
					{
						year: 'numeric',
						month: 'long',
						day: 'numeric',
						hour: 'numeric',
						minute: 'numeric',
						second: 'numeric'
					};
					let aux = `${event.event} (${d.toLocaleString(_lang, dateOptions)}):<br/>`

					for (let param in event.returnValues)
					{
						if (isNaN(Number(param)))
						{
							aux += param + ' = ' + event.returnValues[param] + '<br/>';
						}
					}
					aux = aux.slice(0, aux.length - 5); //Удаляем последнее <br/>
					el.innerHTML = aux; 
					eventsHolder.append(el);
					scrollToDiv.scrollIntoView(false)
				}
			}
		});
	clearEventsBt.addEventListener('click', () =>
		{
			eventsList.forEach(el => el.remove());
			eventsList.length = 0;
			clearEventsBt.hidden = true;
			pauseResumeBt.hidden = true;
		});
	pauseResumeBt.addEventListener('click', () =>
		{
			isPaused = !isPaused;
			pauseResumeBt.innerHTML = isPaused ? _interfaceLang.resumeBt : _interfaceLang.pauseBt;
			clearEventsBt.disabled = isPaused;
		});
}
