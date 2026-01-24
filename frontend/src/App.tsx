import Typing from "./components/typing/Typing";

function App() {
	return (
		<div className="bg-muted w-dvw h-dvh flex flex-col p-4">
			<div className="w-[80dvw] h-[60dvh] bg-primary place-self-center"></div>
			<Typing />
		</div>
	);
}

export default App;
