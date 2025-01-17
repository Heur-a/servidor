import { UserUpdate } from '../components/userClass.js';
import {
    loginUser,
    logoutUser,
    isAuthenticated,
    registerUser,
    sendVerificationEmail,
    sendNewPasswordEmail,
    validateEmailCode,
    updateUserData,
    getUserDataByEmail
} from '../services/authService.js';
import {getUserById, getUserPasswordById, getUserTypeByUserId} from "../services/userService.js";
import bcrypt from "bcryptjs";
import {HttpError} from "../components/HttpErrorClass.js";

/**
 * Handles user registration and session management.
 * @async
 * @function register
 * @param {Object} req - The request object containing user registration data in the body and session information.
 * @param {Object} res - The response object used to send back the desired HTTP response.
 * @returns {Promise<void>} A promise that resolves when the registration process is complete.
 * @throws {Error} Throws an error if the registration process fails, which is handled by sending an error response.
 */
export const register = async (req, res) => {
    try {
        req.session = await registerUser(req.body, req.session);
        console.log('User registered successfully');
        console.log(req.session);
        console.log('Redirecting to user-profile.html');
        res.status(201).redirect('/user/user-profile.html');
    } catch (error) {
        res.status(error.statusCode).json({ message: error.message });
    }
}



export const login = async (req, res) => {
    try {
        req.session = await loginUser(req.body.email, req.body.password, req.session);
        console.log('Login req.session.user:' + req.session.user);
        const userTypeId = await getUserTypeByUserId(req.session.user.id);
        if (!userTypeId || userTypeId === 2) {
            return res.redirect(200,'/user/mediciones.html');
        } else {
            return res.redirect(200,'/admin/admin.html');
        }

    } catch (error) {
        res.status(error.statusCode || 500).json({ message: error.message || "Internal Server Error" });
    }
};

/**
 * Retrieves user data based on the email stored in the session.
 *
 * This asynchronous function extracts the user's email from the session and calls `getUserDataByEmail` to fetch the corresponding user data.
 * If no user data is found, it responds with a 404 status code and an error message. If an error occurs during the process, it responds with the appropriate status code and error message.
 *
 * @async
 * @function handleGetUserData
 * @param {Object} req - The request object containing the user's session information.
 * @param {Object} res - The response object used to send back the desired HTTP response.
 * @returns {Promise<void>} A promise that resolves when the user data retrieval process is complete.
 * @throws {Error} Throws an error if the user data retrieval process fails, which is handled by sending an error response.
 */
export const handleGetUserData = async (req, res) => {
    try{
        const  user  = req.session.user;
        console.log("handleGetUserData, authController: " + user);
        const {id: userId, email: email } = user
        const userData = await getUserDataByEmail(email);
        if (!userData) {
            return res.status(404).json({ message: 'No user found' });
        }
        return res.json(userData);
    } catch (error) {
        return res.status(error.statusCode || 500).json({ message: error.message  ||  'Server error'});
    }


}

/**
 * Handles user logout and session termination.
 * @async
 * @function logout
 * @param {Object} req - The request object containing the current session information.
 * @param {Object} res - The response object used to send back the desired HTTP response.
 * @returns {Promise<void>} A promise that resolves when the logout process is complete.
 * @throws {Error} Throws an error if the logout process fails, which is handled by sending an error response.
 */
export const logout = async (req, res) => {
    try {
        const message = await logoutUser(req.session);
        res.clearCookie('connect.sid'); // Opcional: elimina la cookie de sessió
        res.redirect(201,'/index.html');
    } catch (error) {
        res.status(error.statusCode).json({ message: error.message });
    }
};

/**
 * Checks if the user is authenticated based on the session information.
 * @function checkAuthentication
 * @param {Object} req - The request object containing the session information.
 * @param {Object} res - The response object used to send back the desired HTTP response.
 * @returns {Promise<void>} A promise that resolves when the authentication check is complete.
 */
export const checkAuthentication = (req, res) => {
    const user = isAuthenticated(req.session);

    if (!user) {
        return res.status(401).json({ message: 'Not authenticated' });
    }

    res.status(200).json({ message: 'User is authenticated', user });
};

/**
 * Handles the email verification process by sending a verification email to the user.
 * @async
 * @function handleEmailVerification
 * @param {Object} req - The request object containing the email address in the query parameters.
 * @param {Object} res - The response object used to send back the desired HTTP response.
 * @returns {Promise<void>} A promise that resolves when the email verification process is complete.
 * @throws {Error} Throws an error if the email sending process fails, which is handled by sending an error response.
 */
export const handleEmailVerification = async (req, res) => {
    //Llamar a la función verifyEmail del servicio authService
    try {
        await sendVerificationEmail(req.query.email);
        res.status(200).json({ message: 'Email verified successfully' });
    } catch (error) {
        //todo: change to dinamyc when everything works
        res.status(500).json({ message: error.message });
    }
}

/**
 * Handles the email verification process by validating the provided email code.
 * @async
 * @function handleMakeEmailVerified
 * @param {Object} req - The request object containing the email address and verification code in the query parameters.
 * @param {Object} res - The response object used to send back the desired HTTP response.
 * @returns {Promise<void>} A promise that resolves when the email verification process is complete.
 * @throws {Error} Throws an error if the email verification process fails, which is handled by sending an error response.
 */
export const handleMakeEmailVerified = async (req, res) => {
    //Call verifyEmail from authService
    try{
        await validateEmailCode(req.query.email, req.query.code);
        res.status(200).json({ message: 'Email verified successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

/**
 * Handles the password reset process by sending a new password email to the user.
 * @async
 * @function handleResetPassword
 * @param {Object} req - The request object containing the email address in the query parameters.
 * @param {Object} res - The response object used to send back the desired HTTP response.
 * @returns {Promise<void>} A promise that resolves when the password reset process is complete.
 * @throws {Error} Throws an error if the password reset process fails, which is handled by sending an error response.
 */
export const handleResetPassword = async (req, res) => {
    try {
        await sendNewPasswordEmail(req.query.email);
        res.status(200).json({ message: 'Password changed successfully, ' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

/**
 * Handles the update of user data by validating input and updating the user's information in the database.
 * @async
 * @function handleUpdateUserData
 * @param {Object} req - The request object containing user data in the body and session information.
 * @param {Object} res - The response object used to send back the desired HTTP response.
 * @returns {Promise<void>} A promise that resolves when the user data update process is complete.
 * @throws {Error} Throws an error if the user data update process fails, which is handled by sending an error response.
 */
export const handleUpdateUserData = async (req, res) => {
    try {
        const userSession = req.session.user;
        const {id : userId, email: email} = userSession;
        const olPassword = req.body.oldPassword;

        console.log(olPassword);
        console.log(email);
        console.log(userId);
        console.log(userSession);

        const resPassword = await getUserPasswordById(userId);

        console.log(res);


        if(!olPassword) {
            throw new HttpError(400, "Se necesita la contraseña")
        }

        const isMatch = await bcrypt.compare(olPassword, resPassword.password);
        if (!isMatch) {
            throw new HttpError(400, 'Contraseña incorrecta');
        }

        if (!userId || !email) {
            return res.status(400).json({ message: "User ID and email is required and missing in the session." });
        }

        const user = new UserUpdate.Builder()
            .setId(userId)
            .setName(req.body.name)
            .setEmail(req.session.user.email)
            .setLastName1(req.body.lastName1)
            .setLastName2(req.body.lastName2)
            .setTel(req.body.tel)
            .setPassword(req.body.password)
            .build();

        await updateUserData(user);

        res.status(200).json({ message: "Data changed successfully" });
    } catch (error) {
        res.status(error.statusCode || 500).json({ message: error.message });
    }
}
