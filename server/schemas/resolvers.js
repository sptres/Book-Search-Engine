const { AuthenticationError } = require('apollo-server-express');
const { User, Book } = require('../models');
const { signToken } = require('../utils/auth');

const resolvers = {
    Query: {
        me: async (parent, args, context) => {
            if (context.user) {
                const data = await User.findOne({ _id: context.user._id }).select('-password');
                return data;
            }
            throw new AuthenticationError('Log in failed!');
        },
    },

    Mutation: {
        addUser: async (parent, args) => {
            const user = await User.create(args);
            const token = signToken(user);
            return { token, user };
        },
        login: async(parent, { email, password }) => {
            const user = await User.findOne({ email });

            if(!user) {
                throw new AuthenticationError('User not found!');
            }

            const checkedPw = await user.isCorrectPassword(password);

            if(!checkedPw) {
                throw new AuthenticationError('Wrong credentials!');
            }

            const token = signToken(user);
            return { token, user };
        },
        saveBook: async (parent, { bookData }, context) => {
            if (context.user) {
                const updatedData = await User.findByIdAndUpdate(
                    { _id: context.user._id },
                    { $push: { savedBooks: { bookData }}},
                    { new: true }
                );
                return updatedData;
            }
            throw new AuthenticationError('Must be logged in to save a book!');
        },
        removeBook: async (parent, { bookId }, context) => {
            if (context.user) {
                const updatedData = await User.findOneAndUpdate(
                    { _id: context.user._id },
                    { $pull: { savedBooks: { bookId }}},
                    { new: true},
                );
                return updatedData;
            }
            throw new AuthenticationError('Must be logged into update a book!');
        }
    },
};

module.exports = resolvers;
