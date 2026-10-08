import React, { useEffect, useMemo, useState } from "react";
import { GoogleLogin } from "@react-oauth/google";

import {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
} from "./services/userService";

import {
  clearToken,
  getToken,
  setToken,
} from "./auth";


/* =========================================================
   EMPTY FORM
   ========================================================= */

const emptyForm = {
  name: "",
  age: "",
  city: "",
  state: "",
  pincode: "",
};


/* =========================================================
   SPINNER
   ========================================================= */

function Spinner({ text = "Loading..." }) {
  return (
    <div className="page-loader">
      <div className="spinner"></div>
      <p>{text}</p>
    </div>
  );
}


/* =========================================================
   APP
   ========================================================= */

function App() {

  /* =======================================================
     AUTHENTICATION
     ======================================================= */

  const [token, setAuthToken] = useState(getToken());


  /* =======================================================
     INITIAL LOADING
     ======================================================= */

  const [initialLoading, setInitialLoading] = useState(true);


  /* =======================================================
     USERS
     ======================================================= */

  const [users, setUsers] = useState([]);

  const [loadingUsers, setLoadingUsers] = useState(false);

  const [deletingId, setDeletingId] = useState(null);


  /* =======================================================
     ERRORS
     ======================================================= */

  const [error, setError] = useState("");

  const [validationErrors, setValidationErrors] = useState({});


  /* =======================================================
     FORM
     ======================================================= */

  const [form, setForm] = useState(emptyForm);

  const [editingId, setEditingId] = useState(null);

  const [showAddForm, setShowAddForm] = useState(false);

  const [submitting, setSubmitting] = useState(false);


  /* =======================================================
     SEARCH
     ======================================================= */

  const [search, setSearch] = useState("");


  /* =======================================================
     INITIAL PAGE SPINNER
     ======================================================= */

  useEffect(() => {

    const timer = setTimeout(() => {
      setInitialLoading(false);
    }, 800);

    return () => clearTimeout(timer);

  }, []);


  /* =======================================================
     LOAD USERS AFTER LOGIN
     ======================================================= */

  useEffect(() => {

    if (!token) {
      return;
    }

    loadUsers();

  }, [token]);


  /* =======================================================
     LOAD USERS
     ======================================================= */

  async function loadUsers() {

    try {

      setLoadingUsers(true);

      setError("");

      const data = await getUsers();

      setUsers(Array.isArray(data) ? data : []);

    } catch (err) {

      setError(
        err.message || "Unable to load users."
      );

    } finally {

      setLoadingUsers(false);

    }
  }


  /* =======================================================
     GOOGLE LOGIN
     ======================================================= */

  function handleGoogleSuccess(response) {

    if (!response?.credential) {

      setError(
        "Google login did not return a credential."
      );

      return;
    }

    setToken(response.credential);

    setAuthToken(response.credential);

    setError("");

  }


  /* =======================================================
     GOOGLE LOGIN ERROR
     ======================================================= */

  function handleGoogleError() {

    setError(
      "Google sign-in failed. Please try again."
    );

  }


  /* =======================================================
     SIGN OUT
     ======================================================= */

  function handleSignOut() {

    clearToken();

    setAuthToken(null);

    setUsers([]);

    setForm(emptyForm);

    setEditingId(null);

    setShowAddForm(false);

    setSearch("");

    setError("");

    setValidationErrors({});

  }


  /* =======================================================
     FORM INPUT
     ======================================================= */

  function handleChange(event) {

    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));


    /* Clear field validation error */

    setValidationErrors((previous) => ({
      ...previous,
      [name]: "",
    }));


    /* Clear general error */

    setError("");

  }


  /* =======================================================
     VALIDATE FORM
     ======================================================= */

  function validateForm() {

    const errors = {};


    /* NAME */

    if (!form.name.trim()) {

      errors.name = "Name is required.";

    } else if (form.name.trim().length < 2) {

      errors.name =
        "Name must be at least 2 characters.";

    } else if (form.name.trim().length > 100) {

      errors.name =
        "Name cannot exceed 100 characters.";

    }


    /* AGE */

    if (form.age === "") {

      errors.age = "Age is required.";

    } else if (
      !Number.isInteger(Number(form.age)) ||
      Number(form.age) < 0 ||
      Number(form.age) > 120
    ) {

      errors.age =
        "Age must be an integer between 0 and 120.";

    }


    /* CITY */

    if (!form.city.trim()) {

      errors.city = "City is required.";

    }


    /* STATE */

    if (!form.state.trim()) {

      errors.state = "State is required.";

    }


    /* PINCODE */

    if (!form.pincode.trim()) {

      errors.pincode =
        "Pincode is required.";

    } else if (
      form.pincode.trim().length < 4 ||
      form.pincode.trim().length > 10
    ) {

      errors.pincode =
        "Pincode must be between 4 and 10 characters.";

    }


    return errors;

  }


  /* =======================================================
     SUBMIT ADD / UPDATE
     ======================================================= */

  async function handleSubmit(event) {

    event.preventDefault();


    /* VALIDATE */

    const errors = validateForm();

    setValidationErrors(errors);


    /* Stop if validation failed */

    if (Object.keys(errors).length > 0) {

      setError("");

      return;

    }


    try {

      setSubmitting(true);

      setError("");


      const userData = {

        name: form.name.trim(),

        age: Number(form.age),

        city: form.city.trim(),

        state: form.state.trim(),

        pincode: form.pincode.trim(),

      };


      /* =================================================
         UPDATE USER
         ================================================= */

      if (editingId) {

        const updatedUser =
          await updateUser(
            editingId,
            userData
          );


        setUsers((previous) =>
          previous.map((user) =>
            user.id === Number(editingId)
              ? updatedUser
              : user
          )
        );

      }


      /* =================================================
         ADD USER
         ================================================= */

      else {

        const newUser =
          await createUser(userData);


        setUsers((previous) => [
          ...previous,
          newUser,
        ]);

      }


      /* RESET */

      setForm(emptyForm);

      setValidationErrors({});

      setEditingId(null);

      setShowAddForm(false);


    } catch (err) {

      setError(
        err.message ||
        "Unable to save user."
      );

    } finally {

      setSubmitting(false);

    }

  }


  /* =======================================================
     OPEN ADD USER FORM
     ======================================================= */

  function handleAddUser() {

    setShowAddForm(true);

    setEditingId(null);

    setForm(emptyForm);

    setValidationErrors({});

    setError("");


    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });

  }


  /* =======================================================
     EDIT USER
     ======================================================= */

  function handleEdit(user) {

    setShowAddForm(true);

    setEditingId(user.id);


    setForm({

      name: user.name || "",

      age: user.age ?? "",

      city: user.city || "",

      state: user.state || "",

      pincode: user.pincode || "",

    });


    setValidationErrors({});

    setError("");


    window.scrollTo({

      top: 0,

      behavior: "smooth",

    });

  }


  /* =======================================================
     CANCEL ADD / EDIT
     ======================================================= */

  function handleCancelForm() {

    setShowAddForm(false);

    setEditingId(null);

    setForm(emptyForm);

    setValidationErrors({});

    setError("");

  }


  /* =======================================================
     DELETE USER
     ======================================================= */

  async function handleDelete(id) {

    const confirmed =
      window.confirm(
        "Are you sure you want to delete this user?"
      );


    if (!confirmed) {
      return;
    }


    try {

      setDeletingId(id);

      setError("");


      await deleteUser(id);


      setUsers((previous) =>
        previous.filter(
          (user) =>
            user.id !== Number(id)
        )
      );


    } catch (err) {

      setError(
        err.message ||
        "Unable to delete user."
      );

    } finally {

      setDeletingId(null);

    }

  }


  /* =======================================================
     SEARCH
     ======================================================= */

  const filteredUsers = useMemo(() => {

    const searchText =
      search.trim().toLowerCase();


    if (!searchText) {

      return users;

    }


    return users.filter((user) => {

      return (

        String(user.name || "")
          .toLowerCase()
          .includes(searchText)

        ||

        String(user.city || "")
          .toLowerCase()
          .includes(searchText)

        ||

        String(user.state || "")
          .toLowerCase()
          .includes(searchText)

        ||

        String(user.pincode || "")
          .toLowerCase()
          .includes(searchText)

      );

    });

  }, [users, search]);


  /* =======================================================
     LANDING PAGE SPINNER
     ======================================================= */

  if (initialLoading) {

    return (
      <Spinner
        text="Loading User Directory..."
      />
    );

  }


  /* =======================================================
     GOOGLE LOGIN
     ======================================================= */

  if (!token) {

    return (

      <div className="login-page">

        <div className="login-card">

          <h1>
            User Directory
          </h1>


          <p className="login-subtitle">

            Please sign in with Google
            to continue.

          </p>


          <div className="google-login-container">

            <GoogleLogin

              onSuccess={
                handleGoogleSuccess
              }

              onError={
                handleGoogleError
              }

            />

          </div>


          {error && (

            <div className="error-message">

              {error}

            </div>

          )}

        </div>

      </div>

    );

  }


  /* =======================================================
     MAIN APPLICATION
     ======================================================= */

  return (

    <div className="app-container">


      {/* ===================================================
          HEADER
          =================================================== */}

      <header className="app-header">

        <div>

          <h1>
            User Directory
          </h1>

          <p>
            Manage users
          </p>

        </div>


        <button
          className="signout-button"
          onClick={handleSignOut}
        >

          Sign Out

        </button>

      </header>


      {/* ===================================================
          MAIN
          =================================================== */}

      <main className="main-content">


        {/* =================================================
            ADD USER BUTTON
            ================================================= */}

        {!showAddForm && (

          <div className="add-user-header">

            <h2>
              User List
            </h2>


            <button
              type="button"
              className="primary-button"
              onClick={handleAddUser}
            >

              + Add User

            </button>

          </div>

        )}


        {/* =================================================
            ADD / EDIT FORM
            ================================================= */}

        {showAddForm && (

          <section className="form-card">

            <h2>

              {editingId
                ? "Edit User"
                : "Add User"}

            </h2>


            <form
              onSubmit={handleSubmit}
            >


              <div className="form-grid">


                {/* =========================================
                    NAME
                    ========================================= */}

                <div className="form-group">

                  <label>
                    Name
                  </label>


                  <input
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="Enter name"
                    className={
                      validationErrors.name
                        ? "input-error"
                        : ""
                    }
                  />


                  {validationErrors.name && (

                    <span className="field-error">

                      {validationErrors.name}

                    </span>

                  )}

                </div>


                {/* =========================================
                    AGE
                    ========================================= */}

                <div className="form-group">

                  <label>
                    Age
                  </label>


                  <input
                    type="number"
                    name="age"
                    value={form.age}
                    onChange={handleChange}
                    placeholder="Enter age"
                    min="0"
                    max="120"
                    className={
                      validationErrors.age
                        ? "input-error"
                        : ""
                    }
                  />


                  {validationErrors.age && (

                    <span className="field-error">

                      {validationErrors.age}

                    </span>

                  )}

                </div>


                {/* =========================================
                    CITY
                    ========================================= */}

                <div className="form-group">

                  <label>
                    City
                  </label>


                  <input
                    type="text"
                    name="city"
                    value={form.city}
                    onChange={handleChange}
                    placeholder="Enter city"
                    className={
                      validationErrors.city
                        ? "input-error"
                        : ""
                    }
                  />


                  {validationErrors.city && (

                    <span className="field-error">

                      {validationErrors.city}

                    </span>

                  )}

                </div>


                {/* =========================================
                    STATE
                    ========================================= */}

                <div className="form-group">

                  <label>
                    State
                  </label>


                  <input
                    type="text"
                    name="state"
                    value={form.state}
                    onChange={handleChange}
                    placeholder="Enter state"
                    className={
                      validationErrors.state
                        ? "input-error"
                        : ""
                    }
                  />


                  {validationErrors.state && (

                    <span className="field-error">

                      {validationErrors.state}

                    </span>

                  )}

                </div>


                {/* =========================================
                    PINCODE
                    ========================================= */}

                <div className="form-group">

                  <label>
                    Pincode
                  </label>


                  <input
                    type="text"
                    name="pincode"
                    value={form.pincode}
                    onChange={handleChange}
                    placeholder="Enter pincode"
                    className={
                      validationErrors.pincode
                        ? "input-error"
                        : ""
                    }
                  />


                  {validationErrors.pincode && (

                    <span className="field-error">

                      {validationErrors.pincode}

                    </span>

                  )}

                </div>


              </div>


              {/* =================================================
                  FORM BUTTONS
                  ================================================= */}

              <div className="form-actions">


                <button
                  type="submit"
                  className="primary-button"
                  disabled={submitting}
                >

                  {submitting

                    ? "Saving..."

                    : editingId

                    ? "Update User"

                    : "Add User"

                  }

                </button>


                <button
                  type="button"
                  className="secondary-button"
                  onClick={handleCancelForm}
                >

                  Cancel

                </button>


              </div>


            </form>

          </section>

        )}


        {/* =================================================
            GENERAL ERROR
            ================================================= */}

        {error && (

          <div className="error-message">

            {error}

          </div>

        )}


        {/* =================================================
            USER LIST
            ================================================= */}

        <section className="users-card">


          <div className="users-header">


            <div>

              <h2>
                User List
              </h2>

              <p>

                {users.length} user
                {users.length !== 1
                  ? "s"
                  : ""}

              </p>

            </div>


            <input
              className="search-input"
              type="text"
              placeholder="Search users..."
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
            />

          </div>


          {/* =================================================
              LOADING
              ================================================= */}

          {loadingUsers ? (

            <Spinner
              text="Loading users..."
            />

          )


          /* =================================================
             EMPTY
             ================================================= */

          : filteredUsers.length === 0 ? (

            <div className="empty-state">

              {users.length === 0

                ? "No users found."

                : "No users match your search."

              }

            </div>

          )


          /* =================================================
             TABLE
             ================================================= */

          : (

            <div className="table-container">

              <table>

                <thead>

                  <tr>

                    <th>
                      Name
                    </th>

                    <th>
                      Age
                    </th>

                    <th>
                      City
                    </th>

                    <th>
                      State
                    </th>

                    <th>
                      Pincode
                    </th>

                    <th>
                      Actions
                    </th>

                  </tr>

                </thead>


                <tbody>

                  {filteredUsers.map(
                    (user) => (

                      <tr
                        key={user.id}
                      >

                        <td>
                          {user.name}
                        </td>

                        <td>
                          {user.age}
                        </td>

                        <td>
                          {user.city}
                        </td>

                        <td>
                          {user.state}
                        </td>

                        <td>
                          {user.pincode}
                        </td>


                        <td>

                          <div className="action-buttons">


                            <button
                              type="button"
                              className="edit-button"
                              onClick={() =>
                                handleEdit(
                                  user
                                )
                              }
                            >

                              Edit

                            </button>


                            <button
                              type="button"
                              className="delete-button"
                              onClick={() =>
                                handleDelete(
                                  user.id
                                )
                              }
                              disabled={
                                deletingId ===
                                user.id
                              }
                            >

                              {deletingId ===
                              user.id

                                ? "Deleting..."

                                : "Delete"

                              }

                            </button>


                          </div>

                        </td>

                      </tr>

                    )
                  )}

                </tbody>

              </table>

            </div>

          )}

        </section>

      </main>

    </div>

  );
}


/* =========================================================
   EXPORT
   ========================================================= */

export default App;