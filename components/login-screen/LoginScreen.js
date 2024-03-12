import React from 'react';
import { StyleSheet } from 'react-native';
import { Text, View } from 'react-native';

export default class LoginScreen extends React.Component {
	render() {
		return (
			<View style={styles.container}>
				<Text>hola</Text>
			</View>
		);
	}
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		paddingTop: 15,
		backgroundColor: '#fff',
	}
});
