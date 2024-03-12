import Buffer from "buffer";
import CryptoJS from "crypto-js";

export default class KucoinApi  {
	constructor(apiKey, apiSecret) {
		this.apiKey = apiKey;
		this.apiSecret = apiSecret;
	}
	_generateSignature(endpoint, queryString, nonce) {

		// Create message string to sign requests
		// example: /v1/order/active/1509273046136/symbol=RPX-BTC
		let messageString = endpoint + "/" + nonce + "/" + queryString;

		// Convert message to base64
		messageString = Buffer.Buffer(messageString).toString('base64');

		//Keyed-hash message authentication codes (HMAC) is a mechanism for message authentication using cryptographic hash functions.
		let hmac = CryptoJS.HmacSHA256(messageString, this.apiSecret);

		return hmac.toString(CryptoJS.enc.Hex);

	}
	_getHeaders(endpoint, queryString) {
		const nonce = new Date().getTime();

		return {
			"Content-Type": "application/x-www-form-urlencoded",
			"KC-API-KEY": this.apiKey,
			"KC-API-NONCE" : nonce,   //Client timestamp (exact to milliseconds), before using the calibration time, the server does not accept calls with a time difference of more than 3 seconds
			"KC-API-SIGNATURE" : this._generateSignature(endpoint, queryString, nonce)   //signature after client encryption
		}
	}
	_doRequest(url, query = "") {
		const host = "https://api.kucoin.com";

		return fetch(host + url, {
			method: 'get',
			headers: this._getHeaders(url, query)
		}).then((response) => {
			return response.json();
		}).catch((error) => {
			console.error(error);
		});
	}
	getUser() {
		return this._doRequest('/v1/user/info');
	}
	getBalances() {
		return this._doRequest('/v1/account/balance');
	}
	getBalance() {
		return this._doRequest('/v1/account/BTC/balance');

	}
	getCoins() {
		return this._doRequest('/v1/market/open/symbols');
	}
};