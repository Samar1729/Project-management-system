import { User } from "../models/users.models.js"
import { ApiResponse } from "../utils/api-response.js"
import { asyncHandler } from "../utils/async-handler.js"
import { ApiError } from "../utils/api-error.js"
import { validationResult } from "express-validator"
import crypto from "crypto"
import { ProjectMember } from "../models/projectmembers.models.js"
import { Project } from "../models/project.models.js"
import mongoose from "mongoose"
import { userRolesEnum } from "../utils/constants.js"



const getProjects = asyncHandler(async (req, res) => {

    /* ye function ka kaam ye hai ki LOGGED-IN USER JITNE BHI PROJECTS KA PART HAI UN SAB KO "FIND" KAREGA and
     figure out how many total people are in each of those projects, and return a clean list. */

    const projects = await ProjectMember.aggregate([

        {
            $match: {
                user: new mongoose.Types.ObjectId(req.user._id),
            },
        },

        /* What it does: This is the starting line. We are searching the ProjectMember collection 
        to find only the documents where the user matches the ID of the person making the request.

        Real-world analogy: Imagine standing in a massive library and shouting, "Only bring me
        the membership cards that belong to John Doe!" */

        {
            $lookup: {
                from: "projects",
                localField: "project",
                foreignField: "_id",
                as: "projects",

                /* from: Go look inside the projects collection.

                localField: Look at the project field in our current ProjectMember document. 

                foreignField: Match it to the _id field in the projects collection.

                as: Take whatever you find and stick it into a new array called projects */

                pipeline: [
                    {
                        $lookup: {
                            from: "projectmembers",
                            localField: "_id",
                            foreignField: "project",
                            as: "projectmembers",
                        },
                    },
                    {
                        $addFields: {
                            members: {
                                $size: "$projectmembers",
                            },
                        },
                    },
                ],

                /*
                What it does: Instead of just stopping after finding the project,
                 we run a mini-pipeline inside the project we just found.

                The inner $lookup: While holding the specific project,
                 it goes back to the projectmembers collection to find everyone whose project ID matches this one.

                The $addFields: It uses $size to count how many people were returned in that inner lookup, 
                and saves that number as a new field called members
                */

            },
        },
        {
            $unwind: "$projects",

            /*
            $unwind deconstructs an array field from the input documents to output a document for each element
            */

        },
        {
            $project: {
                project: {
                    _id: 1,
                    name: 1,
                    description: 1,
                    members: 1,
                    createdAt: 1,
                    createdBy: 1,
                },
                role: 1,
                _id: 0,
            },

            /*
                The $project stage formats your final output, exactly like you saw in your notes
                where it selects specific fields to show.
                 
                The 1 and 0: The 1 means "Yes, include this field," and the 0 means "No, hide this field."
                We are keeping the specific project details, the user's role in that project, and hiding the bulky original _id.
            */

        },
    ]);

    return res
        .status(200)
        .json(new ApiResponse(200, projects, "Projects fetched successfully"));

})

const getProjectsById = asyncHandler(async (req, res) => {
    //test
})

const createProject = asyncHandler(async (req, res) => {
    const { name, description } = req.body

    const project = await Project.create({
        name,
        description,
        createdBy: new mongoose.Types.ObjectId(req.user._id)
    })

    //now a new project is being created

    //now who ever is creating the project should be at admin role!!

    await ProjectMember.create({
        user: new mongoose.Types.ObjectId(req.user._id),
        project: new mongoose.Types.ObjectId(project._id),
        role: userRolesEnum.ADMIN
    })

    return res
        .status(200)
        .json(
            new ApiResponse(
                201,
                project,
                "project created successfully"
            )
        )
})

const updateProject = asyncHandler(async (req, res) => {

    const { name, description } = req.body
    const { projectId } = req.params

    const project = await Project.findByIdAndUpdate(
        projectId,
        {
            name,
            description
        },
        { new: true }
    )

    if (!project) {
        throw new ApiError(404, "Project not found")
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                project,
                "Project updated successfully"
            )
        )
})

const deleteProject = asyncHandler(async (req, res) => {
    const { projectId } = req.params
    const project = await Project.findByIdAndDelete(
        projectId,
    )

    if (!project) {
        throw new ApiError(404, "No project found")
    }

    return res
        .status(200)
        .json(new ApiResponse(
            200,
            {},
            "Project deleted successfully"
        ))
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