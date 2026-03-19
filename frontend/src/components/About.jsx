import React from 'react';
import { motion } from 'framer-motion';
import { Github, Linkedin, Mail, Cpu, Globe, Users } from 'lucide-react';

// 🔥 Main Profile Image
import profileImage from '../assets/ajit.png';

// 🔥 Team Images (IMPORTANT — must import)
import shrutiImg from '../assets/shruti.png';
import sujataImg from '../assets/sujata.png';
import bhagyashreeImg from '../assets/swami.png';

const About = () => {

    // ✅ Team Data With Images Properly Attached
    const teamMembers = [
        {
            name: "Shruti Ghuge",
            role: "Team Member",
            specialization: "Development & Design",
            description: "Contributing to development and UI design of the AI Music Recommender.",
            image: shrutiImg
        },
        {
            name: "Sujata Jadhav",
            role: "Team Member",
            specialization: "Development & Testing",
            description: "Worked on backend testing and improving user experience.",
            image: sujataImg
        },
        {
            name: "Bhagyashree Swami",
            role: "Team Member",
            specialization: "Development & Research",
            description: "Focused on research and improving recommendation logic.",
            image: bhagyashreeImg
        }
    ];

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="min-h-screen pt-24 pb-12 px-6"
        >
            <div className="max-w-7xl mx-auto">

                {/* 🔥 Developer Section */}
                <div className="grid md:grid-cols-2 gap-12 items-center mb-20">

                    {/* Profile Image */}
                    <motion.div
                        initial={{ x: -50, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        className="flex justify-center"
                    >
                        <div className="w-72 h-72 rounded-full overflow-hidden border-4 border-purple-400/40 shadow-[0_0_40px_rgba(168,85,247,0.6)]">
                            <img
                                src={profileImage}
                                alt="Ajit Paraskar"
                                className="w-full h-full object-cover"
                            />
                        </div>
                    </motion.div>

                    {/* Developer Info */}
                    <motion.div
                        initial={{ x: 50, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        className="bg-black/40 backdrop-blur-xl border border-white/10 p-10 rounded-3xl"
                    >
                        <h2 className="text-sm text-purple-400 font-bold uppercase">
                            About The Developer
                        </h2>

                        <h1 className="text-5xl font-bold text-white mb-6">
                            Ajit Paraskar
                        </h1>

                        <p className="text-gray-300 mb-4 flex items-center gap-2">
                            <Globe /> Computer Engineering Student
                        </p>

                        <p className="text-gray-300 mb-6 flex items-center gap-2">
                            <Cpu /> Machine Learning & Full Stack Developer
                        </p>

                        <p className="text-gray-400 leading-relaxed">
                            Passionate about building AI-powered applications by combining
                            Machine Learning with modern web technologies to create real-world solutions.
                        </p>

                        {/* Social Links */}
                        <div className="flex gap-4 mt-6">
                            <a href="#" className="p-3 bg-white/5 rounded-lg hover:bg-blue-600 transition">
                                <Linkedin />
                            </a>
                            <a href="#" className="p-3 bg-white/5 rounded-lg hover:bg-gray-700 transition">
                                <Github />
                            </a>
                            <a href="#" className="p-3 bg-white/5 rounded-lg hover:bg-red-500 transition">
                                <Mail />
                            </a>
                        </div>
                    </motion.div>
                </div>

                {/* 🔥 Team Section */}
                <div className="text-center mb-12">
                    <h2 className="text-5xl font-bold text-purple-400 flex justify-center items-center gap-3">
                        <Users /> Our Team
                    </h2>
                    <p className="text-gray-400 mt-4">
                        Meet the talented individuals behind this project
                    </p>
                </div>

                {/* 🔥 Team Cards */}
                <div className="grid md:grid-cols-3 gap-8">
                    {teamMembers.map((member, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 40 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.2 }}
                            whileHover={{ y: -10 }}
                            className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-xl border border-white/10 p-6 rounded-2xl text-center"
                        >

                            {/* ✅ MEMBER PHOTO */}
                            <div className="w-28 h-28 mx-auto rounded-full overflow-hidden border-2 border-purple-400/40 shadow-[0_0_20px_rgba(168,85,247,0.6)]">
                                <img
                                    src={member.image}
                                    alt={member.name}
                                    className="w-full h-full object-cover"
                                />
                            </div>

                            <h3 className="text-xl font-bold text-white mt-4">
                                {member.name}
                            </h3>

                            <p className="text-purple-400 text-sm">{member.role}</p>

                            <p className="text-gray-400 text-sm mt-2">
                                {member.specialization}
                            </p>

                            <p className="text-gray-300 text-sm mt-4">
                                {member.description}
                            </p>

                            {/* Social */}
                            <div className="flex justify-center gap-3 mt-6">
                                <a href="#" className="p-2 bg-white/5 rounded-lg hover:bg-blue-600">
                                    <Linkedin size={18} />
                                </a>
                                <a href="#" className="p-2 bg-white/5 rounded-lg hover:bg-gray-700">
                                    <Github size={18} />
                                </a>
                                <a href="#" className="p-2 bg-white/5 rounded-lg hover:bg-red-500">
                                    <Mail size={18} />
                                </a>
                            </div>

                        </motion.div>
                    ))}
                </div>

            </div>
        </motion.div>
    );
};

export default About;
