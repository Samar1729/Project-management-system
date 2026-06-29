import { User } from "../models/users.models.js"
import { ApiResponse } from "../utils/api-response.js"
import { asyncHandler } from "../utils/async-handler.js"
import { ApiError } from "../utils/api-error.js"
import { validationResult } from "express-validator"
import crypto from "crypto"
import { ProjectMember } from "../models/projectmembers.models.js"




const getProjects = asyncHandler(async (req, res) => {
    //test
})

const getProjectsById = asyncHandler(async (req, res) => {
    //test
})

const createProject = asyncHandler(async (req, res) => {
    //test
})

const updateProject = asyncHandler(async (req, res) => {
    //test
})

const deleteProject = asyncHandler(async (req, res) => {
    //test
})

const addMembersToProject = asyncHandler(async (req, res) => {
    //test
})

const getProjectMembers = asyncHandler(async (req, res) => {
    //test
})

const updateMemberRole = asyncHandler(async (req, res) => {
    //test
})

const deleteMember = asyncHandler(async (req, res) => {
    //test
})

export {
    addMembersToProject,
    createProject,
    getProjectMembers,
    getProjects,
    getProjectsById,
    deleteMember,
    deleteProject,
    updateMemberRole,
    updateProject,


}