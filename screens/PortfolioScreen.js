import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { Text, View, TextInput } from 'react-native';
import KucoinApi from '../api/kucoinApi';

export default class LinksScreen extends React.Component {
	static navigationOptions = {
		title: 'Portfolio',
	};

	constructor(props) {
		super(props);
		this.state = {
			isLoading: true,
			assets: [],
			apiKey: "",
			apiSecret: "",
			formError: ""
		};
		this.formInput = "";
	}

	_getBalances() {
		this.kucoinApi.getBalances().then((req) => {
			this.setState({
				isLoading: false,
				assets: req.data
			});
		});
	}

	_renderAssets() {
		if (this.state.assets.length === 0) {
			return (
				<Text>No assets yet.</Text>
			);
		}

		return this.state.assets.map((asset) => {
			if (asset.balance === 0) return false;
			return (<View key={asset.coinType} style={styles.asset}>
				<View style={styles.assetCoin}><Text>{asset.coinType}</Text></View>
				<View style={styles.assetBalance}><Text>{asset.balance}</Text></View>
			</View>);
		});
	}

	_doLogin() {
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
					formError: ""
				});
				this._getBalances();

			}
		});
	}

	_setApiKeyValue = (value) => {
		this.setState({
				apiKey: value
			},
			() => {
				if (value.length === 24) this._doLogin();
			});
	}

	_setSecretValue = (value) => {
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

		return (
			<View style={styles.container}>
				<Text>Api Key:</Text>
				<TextInput
					style={{height: 40}}
					ref={ref => this.formInput = ref}
					onChangeText={this._setApiKeyValue}
				/>
				<Text>Api Secret:</Text>
				<TextInput
					style={{height: 40}}
					ref={ref => this.formInput = ref}
					onChangeText={this._setSecretValue}
				/>
				{ getErrorText() }
			</View>

		);
	}

	render() {
		console.log(this.state.assets);

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
		flex: 0.5,
		padding: 20,
		backgroundColor: 'powderblue'
	},
	assetBalance: {
		flex: 0.5,
		padding: 20,
		backgroundColor: 'steelblue'
	}
});
