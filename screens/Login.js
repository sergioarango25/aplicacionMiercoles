import React, { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebaseConfig.js";

export default function InicioSesion() {

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [mensaje, setMensaje] = useState("");

    const handleIngresar = async () => {

        setError("");
        setMensaje("");

        try {
            const usuario = await signInWithEmailAndPassword(
                auth,
                email,
                password
            );

            console.log("Ingresando:", usuario.user.email);

            setMensaje("Ingresando correctamente");

        } catch (err) {
            setError("Correo o contraseña incorrectos");
        }
    };

    return (
        <div>
            <h2>Inicio de sesion</h2>

            <input
                type="email"
                placeholder="Correo"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
            />

            <input
                type="password"
                placeholder="Contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
            />

            <button onClick={handleIngresar}>
                Ingresar
            </button>

            {error && <p>{error}</p>}

            {mensaje && <p>{mensaje}</p>}
        </div>
    );
}
