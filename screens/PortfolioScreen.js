import React from 'react';
import { ScrollView, StyleSheet, AsyncStorage } from 'react-native';
import { Text, View, TextInput, Button } from 'react-native';
import KucoinApi from '../api/kucoinApi';

export default class LinksScreen extends React.Component {
	static navigationOptions = {
		title: 'Portfolio',
	};

	constructor(props) {
		super(props);

		this.state = {
			timeout: false,
			isLoading: true,
			assets: [],
			apiKey: "5a895eef32329205e31406b7",
			apiSecret:  "b8d5e669-4cc6-4907-856f-a05fb74af2b5",
			formError: ""
		};

		this.formInput = "";
	}

	componentDidMount() {
		if (this.state.apiKey && this.state.apiSecret) {
			this._doLogin();
			return false;
		}

		this._getKeyStorage().then((apiKey) => {
			this._getSecretStorage().then((apiSecret) => {
				this.setState({
					apiKey: apiKey || "",
					apiSecret:  apiSecret || ""
				});
			}).catch((error) => {
				console.log(error);
			});
		}).catch((error) => {
			console.log(error);
		});
	}

	async _getKeyStorage() {
		try {
			const result = await AsyncStorage.getItem("apiKey");
			return result;
		}
		catch(error) {
			console.log(error);
		}
	}

	async _getSecretStorage() {
		try {
			const result = await AsyncStorage.getItem("apiSecret");
			return result;
		}
		catch(error) {
			console.log(error);
		}
	}

	_getBalances(balances, coins) {
		// when you are timed out from the api
		if (!balances.data) {
			this.setState({
				timeout: true
			});
			return true;
		}

		this.setState({
			isLoading: false,
			assets: balances.data,
			coins: coins.data
		});
	}

	_renderAssets() {
		if (this.state.assets.length === 0) {
			return (
				<Text>No assets yet.</Text>
			);
		}
		const coinBTC = this.state.coins.filter((coin) => {
			return coin.coinType === "BTC" && coin.coinTypePair === "USDT";
		})[0];

		const allAssets = this.state.assets.map((asset) => {
			if (asset.balance === 0) return false;
			const currentCoin = this.state.coins.filter((coin) => {
				return (coin.coinType === asset.coinType && coin.coinTypePair === "BTC") || (asset.coinType === "BTC");
			});
			if (!currentCoin[0]) return false;

			const currencyFee = currentCoin[0].feeRate * asset.balance;

			const balanceBTC = asset.coinType === "BTC" ? asset.balance : currentCoin[0].sell * asset.balance;
			// Possible balance values sell, buy, lastDealPrice, low, high
			const balanceUSD = balanceBTC * coinBTC.sell;

			return {
				balance: asset.balance,
				coinType: asset.coinType,
				chage24: currentCoin[0].changeRate,
				balanceBTC,
				balanceUSD,
				currencyFee
			};
		}).filter((asset) => {
			return asset !== false;
		});

		const orderedAssets = allAssets.sort((a,b) => {
			if (a.balanceUSD > b.balanceUSD) return -1;
			else return 1;
		});

		const totalAsset = orderedAssets.reduce(( previousValue, currentValue) => {
			return {
				totalBTC: previousValue.totalBTC + currentValue.balanceBTC
			}
		}, {
			totalBTC: 0
		});

		const finalAssets =  orderedAssets.map((asset) => {
			return (<View key={asset.coinType} style={styles.asset}>
				<View style={styles.assetCoin}><Text>{asset.coinType}</Text></View>
				<View style={styles.assetBalance}>
					<Text>balance: {asset.balance}</Text>
					<Text>Fee Rate: {asset.currencyFee}$</Text>
					<Text>balanceBTC: {Math.round(asset.balanceBTC*100000)/100000}$</Text>
					<Text>balanceUSD: {Math.round(asset.balanceUSD*100000)/100000}$</Text>
					<Text style={asset.chage24 < 0 ? {color: "red"} : {color: "green"}}>chage24h: {Math.round(asset.chage24*10000)/100}%</Text>
				</View>
			</View>);
		});

		const assetsWithTotal = [(
			<View key="total" style={styles.asset}>
				<View style={styles.assetCoin}><Text>Total</Text></View>
				<View style={styles.assetBalance}>
					<Text>totalBTC: {totalAsset.totalBTC}$</Text>
					<Text>totalUSD: {totalAsset.totalBTC * coinBTC.sell}$</Text>

				</View>
			</View>
		)];

		assetsWithTotal.push(finalAssets);

		return assetsWithTotal;
	}

	_doLogin = () => {
		if (!this.state.apiKey || !this.state.apiSecret) return false;

		console.log(this.state.apiKey);
		console.log(this.state.apiSecret);

		this.kucoinApi = new KucoinApi(this.state.apiKey, this.state.apiSecret);

		this.kucoinApi.getUser().then((req) => {
			console.log(req);
			if(req.success === false) {
				this.setState({
					formError: "Wrong credentials"
				});
			} else {
				this.setState({
					formError: "",
					timeout: false
				});
				setInterval(() => {
					Promise.all([this.kucoinApi.getBalances(), this.kucoinApi.getCoins()]).then((result) => {
						this._getBalances(result[0], result[1]);
					}).catch(error => {
						console.log(error)
					});
				}, 5000);
			}
		});
	}

	_setApiKeyValue = (value) => {
		AsyncStorage.setItem("apiKey", value);
		this.setState({
				apiKey: value
			},
			() => {
				if (value.length === 24) this._doLogin();
			});
	}

	_setSecretValue = (value) => {
		AsyncStorage.setItem("apiSecret", value);
		this.setState({
				apiSecret: value
			},
			() => {
				if (value.length === 36) this._doLogin();
			});
	}

	_renderLogin() {
		const getErrorText = () => (
			<Text style={{color: "red"}}>{ this.state.formError }</Text>
		);

		console.log(this.state.apiKey);
		console.log(this.state.apiSecret);

		return (
			<View style={styles.container}>
				<Text>Api Key:</Text>
				<TextInput
					style={{height: 40}}
					ref={ref => this.formInput = ref}
					value={this.state.apiKey}
					onChangeText={this._setApiKeyValue}
				/>
				<Text>Api Secret:</Text>
				<TextInput
					style={{height: 40}}
					ref={ref => this.formInput = ref}
					secureTextEntry
					value={this.state.apiSecret}
					onChangeText={this._setSecretValue}
				/>
				<Button title="Login" onPress={this._doLogin} />
				{ getErrorText() }
			</View>

		);
	}

	render() {
		if (this.state.timeout) {
			return (
				<View>
					<Button title="Refresh Session" onPress={this._doLogin} />
					<ScrollView style={styles.container}>
						{ !this.state.isLoading && this._renderAssets() }
					</ScrollView>
				</View>
			);
		}

		return this.state.assets.length ? (
				<ScrollView style={styles.container}>
					{ !this.state.isLoading && this._renderAssets() }
				</ScrollView>
			) : this._renderLogin();
	}
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		paddingTop: 15,
		backgroundColor: '#fff',
	},
	asset: {
		flex: 1,
		alignItems: 'center',
		flexDirection: "row",
		borderBottomColor: "black",
		borderBottomWidth: 2
	},
	assetCoin: {
		flex: 0.2,
		padding: 20,
		height: "100%",
		alignItems: 'center',
		backgroundColor: 'powderblue'
	},
	assetBalance: {
		flex: 0.8,
		padding: 20
	}
});
