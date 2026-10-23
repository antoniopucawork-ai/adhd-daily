import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    passwordHash: {
      type: String,
      required: true,
      select: false,
    },

    // Qui salviamo le preferenze dell'utente.
    // Ci serviranno per ricordare come ha organizzato la sua Home.
    preferences: {
      // Controlliamo se ha già completato la personalizzazione iniziale.
      onboardingCompleted: {
        type: Boolean,
        default: false,
      },

      // Qui salviamo i moduli scelti dall'utente.
      homeModules: {
        type: [
          {
            // Identifica il modulo.
            id: {
              type: String,
              required: true,
            },

            // Indica se il modulo deve essere visibile.
            enabled: {
              type: Boolean,
              default: true,
            },

            // Indica la posizione del modulo nella Home.
            order: {
              type: Number,
              required: true,
            },
          },
        ],

        // Questa è la configurazione iniziale consigliata.
        // L'utente potrà modificarla durante la personalizzazione.
        default: [
          { id: "mindDump", enabled: true, order: 0 },
          { id: "today", enabled: true, order: 1 },
          { id: "nextStep", enabled: true, order: 2 },
        ],
      },
    },
  },
  {
    timestamps: true,
  },
);

const User = mongoose.model("User", userSchema);

export default User;
