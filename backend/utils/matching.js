// Vector validation and normalization utilities
const EXPECTED_VECTOR_LENGTH = 10;

export const validateAndNormalizeVector = (vector, vectorName = 'vector') => {
    if (!vector || !Array.isArray(vector)) {
        console.warn(`${vectorName} is not a valid array:`, vector);
        return new Array(EXPECTED_VECTOR_LENGTH).fill(0.5);
    }
    
    if (vector.length === 0) {
        console.warn(`${vectorName} is empty`);
        return new Array(EXPECTED_VECTOR_LENGTH).fill(0.5);
    }
    
    // Normalize vector to expected length
    const normalizedVector = [...vector];
    
    if (normalizedVector.length < EXPECTED_VECTOR_LENGTH) {
        // Pad with neutral values (0.5) if too short
        while (normalizedVector.length < EXPECTED_VECTOR_LENGTH) {
            normalizedVector.push(0.5);
        }
        console.log(`${vectorName} padded from ${vector.length} to ${EXPECTED_VECTOR_LENGTH}`);
    } else if (normalizedVector.length > EXPECTED_VECTOR_LENGTH) {
        // Truncate if too long
        normalizedVector.splice(EXPECTED_VECTOR_LENGTH);
        console.log(`${vectorName} truncated from ${vector.length} to ${EXPECTED_VECTOR_LENGTH}`);
    }
    
    // Ensure all values are numbers between 0 and 1
    return normalizedVector.map((val, index) => {
        if (typeof val !== 'number' || isNaN(val)) {
            console.warn(`Invalid value at index ${index} in ${vectorName}:`, val);
            return 0.5;
        }
        return Math.max(0, Math.min(1, val));
    });
};

// Robust cosine similarity calculation
export const cosineSimilarity = (vectorA, vectorB) => {
    try {
        // Validate and normalize vectors
        const normalizedA = validateAndNormalizeVector(vectorA, 'vectorA');
        const normalizedB = validateAndNormalizeVector(vectorB, 'vectorB');
        
        if (normalizedA.length !== normalizedB.length) {
            console.error('Vector normalization failed:', {
                lengthA: normalizedA.length,
                lengthB: normalizedB.length
            });
            return 0;
        }
        
        if (normalizedA.length === 0) return 0;
        
        let dotProduct = 0;
        let normA = 0;
        let normB = 0;
        
        for (let i = 0; i < normalizedA.length; i++) {
            dotProduct += normalizedA[i] * normalizedB[i];
            normA += normalizedA[i] * normalizedA[i];
            normB += normalizedB[i] * normalizedB[i];
        }
        
        if (normA === 0 || normB === 0) {
            console.warn('Zero norm vectors detected');
            return 0;
        }
        
        return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
    } catch (error) {
        console.error('Error in cosine similarity calculation:', error);
        return 0;
    }
};

// Enhanced match score calculation with robust error handling
export const calculateMatchScore = (userA, userB) => {
    try {
        // Validate users
        if (!userA || !userB) {
            console.warn('Missing user data for match calculation');
            return 0;
        }
        
        // Debug logging
        console.log('Calculating match score between users:', {
            userA: userA._id,
            userB: userB._id,
            userA_selfVector_length: userA.selfVector?.length || 0,
            userA_desiredVector_length: userA.desiredVector?.length || 0,
            userB_selfVector_length: userB.selfVector?.length || 0,
            userB_desiredVector_length: userB.desiredVector?.length || 0
        });
        
        // Ensure both users have vectors (create default if missing)
        const userASelf = userA.selfVector || [];
        const userADesired = userA.desiredVector || [];
        const userBSelf = userB.selfVector || [];
        const userBDesired = userB.desiredVector || [];
        
        // If vectors are empty, return low score
        if (userASelf.length === 0 && userADesired.length === 0 && 
            userBSelf.length === 0 && userBDesired.length === 0) {
            console.warn('All vectors are empty for users:', userA._id, userB._id);
            return 0.1; // Very low but not zero
        }
        
        // Calculate similarity scores with robust error handling
        const selfSimilarity = cosineSimilarity(userASelf, userBSelf);
        const desiredAtoB = cosineSimilarity(userADesired, userBSelf);
        const desiredBtoA = cosineSimilarity(userBDesired, userASelf);
        
        console.log('Similarity scores:', {
            selfSimilarity,
            desiredAtoB,
            desiredBtoA
        });
        
        // Combined match score with fallback logic
        let matchScore;
        
        if (selfSimilarity > 0 && desiredAtoB > 0 && desiredBtoA > 0) {
            // All three components available
            matchScore = selfSimilarity * desiredAtoB * desiredBtoA;
        } else if (selfSimilarity > 0 && (desiredAtoB > 0 || desiredBtoA > 0)) {
            // Self similarity + at least one desired component
            matchScore = selfSimilarity * Math.max(desiredAtoB, desiredBtoA) * 0.8;
        } else if (selfSimilarity > 0) {
            // Only self similarity available
            matchScore = selfSimilarity * 0.6;
        } else {
            // Fallback to basic compatibility
            matchScore = 0.1;
        }
        
        // Normalize to 0-1 range and ensure it's positive
        const finalScore = Math.max(0.05, Math.min(1, matchScore));
        
        console.log('Final match score:', finalScore);
        return finalScore;
        
    } catch (error) {
        console.error('Error calculating match score:', error);
        console.error('User A data:', {
            id: userA?._id,
            selfVector: userA?.selfVector,
            desiredVector: userA?.desiredVector
        });
        console.error('User B data:', {
            id: userB?._id,
            selfVector: userB?.selfVector,
            desiredVector: userB?.desiredVector
        });
        return 0.05; // Return minimal score instead of 0 to avoid filtering out
    }
};

// Enhanced potential matches with better error handling and replacement priority
export const getPotentialMatches = async (user, User, limit = 50, Listing = null) => {
    try {
        console.log('Getting potential matches for user:', user._id);
        
        // Find users of opposite type in the same city
        const oppositeType = user.userType === 'find-room' ? 'find-roommate' : 'find-room';
        
        const potentialMatches = await User.find({
            userType: oppositeType,
            city: { $regex: new RegExp(user.city, 'i') },
            isProfileComplete: true,
            // Exclude current user and users already liked or disliked
            _id: { 
                $nin: [
                    user._id,
                    ...user.likedUsers,
                    ...user.dislikedUsers
                ]
            }
        }).select('name age city profilePicture profilePictureData instagramHandle bio userType selfVector desiredVector gender preferredGender')
          .limit(limit * 3) // Get more to filter after scoring
          .lean();
        
        // Gender filtering
        let filteredMatches = potentialMatches;
        if (user.userType === 'find-roommate') {
            filteredMatches = filteredMatches.filter(match => {
                // If user has a preferredGender, match must have that gender (unless 'any')
                const userPref = user.preferredGender || 'any';
                const matchPref = match.preferredGender || 'any';
                const genderOk = userPref === 'any' || match.gender === userPref;
                // Also, if match has a preferredGender, user's gender must match (unless 'any')
                const reverseOk = matchPref === 'any' || user.gender === matchPref;
                return genderOk && reverseOk;
            });
        }
        
        console.log(`Found ${filteredMatches.length} potential matches`);
        
        if (filteredMatches.length === 0) {
            return [];
        }
        
        // Calculate match scores with enhanced error handling and replacement priority
        const matchesWithScores = [];
        
        for (const match of filteredMatches) {
            try {
                const matchScore = calculateMatchScore(user, match);
                let hasReplacementListing = false;
                
                // Check if user has active replacement listings (only for find-roommate users)
                if (match.userType === 'find-roommate' && Listing) {
                    const replacementListing = await Listing.findOne({
                        owner: match._id,
                        isReplacementListing: true,
                        replacementStatus: 'active',
                        status: 'active'
                    });
                    hasReplacementListing = !!replacementListing;
                }
                
                // Boost match score for replacement listings
                const boostedScore = hasReplacementListing ? Math.min(1, matchScore * 1.5) : matchScore;
                
                matchesWithScores.push({
                    ...match,
                    matchScore: boostedScore,
                    hasProfilePicture: !!match.profilePictureData,
                    hasReplacementListing
                });
            } catch (error) {
                console.error(`Error calculating score for match ${match._id}:`, error);
                // Add with minimal score instead of skipping
                matchesWithScores.push({
                    ...match,
                    matchScore: 0.05,
                    hasProfilePicture: !!match.profilePictureData,
                    hasReplacementListing: false
                });
            }
        }
        
        // Sort by replacement priority first, then by match score
        const sortedMatches = matchesWithScores
            .filter(match => match.matchScore > 0.01) // Very low threshold
            .sort((a, b) => {
                // First priority: replacement listings
                if (a.hasReplacementListing && !b.hasReplacementListing) return -1;
                if (!a.hasReplacementListing && b.hasReplacementListing) return 1;
                // Second priority: match score
                return b.matchScore - a.matchScore;
            })
            .slice(0, limit);
        
        console.log(`Returning ${sortedMatches.length} matches with scores`);
        return sortedMatches;
        
    } catch (error) {
        console.error('Error getting potential matches:', error);
        return [];
    }
};

// Check if two users are a mutual match
export const checkMutualMatch = async (userA, userB, User) => {
    try {
        // Convert to string for reliable comparison
        const userAId = userA._id.toString();
        const userBId = userB._id.toString();
        
        // Check if userA likes userB
        const userALikesB = userA.likedUsers.some(id => id.toString() === userBId);
        // Check if userB likes userA
        const userBLikesA = userB.likedUsers.some(id => id.toString() === userAId);
        
        console.log('Checking mutual match:', {
            userA: userAId,
            userB: userBId,
            userALikesB,
            userBLikesA,
            userA_likedUsers: userA.likedUsers.map(id => id.toString()),
            userB_likedUsers: userB.likedUsers.map(id => id.toString())
        });
        
        if (userALikesB && userBLikesA) {
            // Check if match already exists to avoid duplicates
            const matchAlreadyExists = userA.matches.some(match => match.user.toString() === userBId);
            if (matchAlreadyExists) {
                console.log('Match already exists, skipping...');
                return { isMatch: true, matchScore: 0 };
            }
            
            // It's a match! Calculate the match score
            const matchScore = calculateMatchScore(userA, userB);
            
            console.log('Creating mutual match with score:', matchScore);
            
            // Add to matches array for both users
            const matchData = {
                user: userB._id,
                matchScore: matchScore,
                createdAt: new Date()
            };
            
            const reverseMatchData = {
                user: userA._id,
                matchScore: matchScore,
                createdAt: new Date()
            };
            
            // Update both users
            await User.findByIdAndUpdate(userA._id, {
                $push: { matches: matchData }
            });
            
            await User.findByIdAndUpdate(userB._id, {
                $push: { matches: reverseMatchData }
            });
            
            console.log('Match created successfully!');
            return { isMatch: true, matchScore };
        }
        
        return { isMatch: false, matchScore: 0 };
    } catch (error) {
        console.error('Error checking mutual match:', error);
        return { isMatch: false, matchScore: 0 };
    }
};

// Utility function to fix orphaned matches (mutual likes without matches)
export const fixOrphanedMatches = async (User) => {
    try {
        console.log('Starting orphaned matches fix...');
        
        // Find all users with likes
        const users = await User.find({ 
            likedUsers: { $exists: true, $ne: [] } 
        }).select('_id likedUsers matches');
        
        let fixedCount = 0;
        
        for (const user of users) {
            for (const likedUserId of user.likedUsers) {
                // Check if the liked user also likes this user back
                const likedUser = await User.findById(likedUserId);
                if (!likedUser) continue;
                
                const mutualLike = likedUser.likedUsers.some(id => id.toString() === user._id.toString());
                
                if (mutualLike) {
                    // Check if match already exists
                    const matchExists = user.matches.some(match => match.user.toString() === likedUserId.toString());
                    
                    if (!matchExists) {
                        // Create the missing match
                        const matchScore = calculateMatchScore(user, likedUser);
                        
                        await User.findByIdAndUpdate(user._id, {
                            $push: { 
                                matches: {
                                    user: likedUserId,
                                    matchScore: matchScore,
                                    createdAt: new Date()
                                }
                            }
                        });
                        
                        // Also add reverse match if it doesn't exist
                        const reverseMatchExists = likedUser.matches.some(match => match.user.toString() === user._id.toString());
                        if (!reverseMatchExists) {
                            await User.findByIdAndUpdate(likedUserId, {
                                $push: { 
                                    matches: {
                                        user: user._id,
                                        matchScore: matchScore,
                                        createdAt: new Date()
                                    }
                                }
                            });
                        }
                        
                        fixedCount++;
                        console.log(`Fixed orphaned match: ${user._id} <-> ${likedUserId}`);
                    }
                }
            }
        }
        
        console.log(`Fixed ${fixedCount} orphaned matches`);
        return fixedCount;
    } catch (error) {
        console.error('Error fixing orphaned matches:', error);
        return 0;
    }
};

// Enhanced questionnaire mapping with validation
export const mapSelfAnswersToVector = (answers) => {
    if (!answers || typeof answers !== 'object') {
        console.warn('Invalid answers provided to mapSelfAnswersToVector:', answers);
        return new Array(EXPECTED_VECTOR_LENGTH).fill(0.5);
    }
    
    const vector = [];
    
    const questionMappings = {
        cleanliness: { 'very-clean': 1, 'clean': 0.7, 'moderate': 0.5, 'relaxed': 0.3 },
        sleepPattern: { 'early-bird': 1, 'normal': 0.5, 'night-owl': 0 },
        workStyle: { 'wfh': 1, 'office': 0.5, 'hybrid': 0.7 },
        foodHabits: { 'cook-often': 1, 'sometimes': 0.5, 'rarely': 0, 'order-out': 0.3 },
        partyStyle: { 'party-lover': 1, 'occasional': 0.5, 'quiet': 0 },
        guests: { 'frequently': 1, 'sometimes': 0.5, 'rarely': 0 },
        socialEnergy: { 'very-social': 1, 'social': 0.7, 'moderate': 0.5, 'introvert': 0 },
        petTolerance: { 'love-pets': 1, 'okay-with-pets': 0.5, 'no-pets': 0 },
        musicVolume: { 'loud': 1, 'moderate': 0.5, 'quiet': 0 },
        weekendPref: { 'go-out': 1, 'home-activities': 0.5, 'rest': 0 }
    };
    
    // Map each answer to its numerical value
    Object.keys(questionMappings).forEach(key => {
        if (answers[key] && questionMappings[key][answers[key]] !== undefined) {
            vector.push(questionMappings[key][answers[key]]);
        } else {
            vector.push(0.5); // Default neutral value
        }
    });
    
    return validateAndNormalizeVector(vector, 'selfVector');
};

export const mapDesiredAnswersToVector = (answers, userType = 'find-roommate') => {
    if (!answers || typeof answers !== 'object') {
        console.warn('Invalid answers provided to mapDesiredAnswersToVector:', answers);
        return new Array(EXPECTED_VECTOR_LENGTH).fill(0.5);
    }
    
    const vector = [];
    
    if (userType === 'find-room') {
        // Questions for people looking for rooms
        const roomQuestionMappings = {
            budgetRange: { 'under-15000': 0.2, '15000-25000': 0.4, '25000-35000': 0.6, '35000-45000': 0.8, 'over-45000': 1 },
            roomType: { 'private-room': 1, 'shared-room': 0.7, 'studio': 0.5, 'flexible': 0.6 },
            locationPreference: { 'very-important': 1, 'important': 0.7, 'flexible': 0.5, 'not-important': 0.3 },
            moveInTimeline: { 'asap': 1, 'month': 0.7, 'next-month': 0.5, 'flexible': 0.3 },
            leaseLength: { 'short-term': 0.3, 'medium-term': 0.6, 'long-term': 1, 'flexible': 0.5 },
            amenities: { 'wifi': 0.9, 'ac': 0.8, 'heating': 0.7, 'laundry': 0.8, 'parking': 0.7, 'gym': 0.6, 'pool': 0.5, 'balcony': 0.5, 'security': 0.8, 'elevator': 0.6, 'kitchen': 0.9, 'furnished': 0.7, 'cleaning': 0.6, 'utilities': 0.8, 'none': 0.3 },
            furnished: { 'furnished': 1, 'unfurnished': 0.3, 'partially': 0.7, 'flexible': 0.5 },
            roommatePreference: { 'prefer-roommates': 1, 'okay-roommates': 0.7, 'prefer-alone': 0.3, 'must-alone': 0 }
        };
        
        // Map each answer to its numerical value for room questions
        Object.keys(roomQuestionMappings).forEach(key => {
            if (answers[key]) {
                if (key === 'amenities' && Array.isArray(answers[key])) {
                    // Handle multiselect amenities - calculate average score
                    const selectedAmenities = answers[key];
                    if (selectedAmenities.length === 0) {
                        vector.push(0.3); // Default for no amenities selected
                    } else {
                        const scores = selectedAmenities.map(amenity => 
                            roomQuestionMappings[key][amenity] || 0.5
                        );
                        const averageScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
                        vector.push(averageScore);
                    }
                } else if (roomQuestionMappings[key][answers[key]] !== undefined) {
                    vector.push(roomQuestionMappings[key][answers[key]]);
                } else {
                    vector.push(0.5); // Default neutral value
                }
            } else {
                vector.push(0.5); // Default neutral value
            }
        });
    } else {
        // Questions for people looking for roommates (existing logic)
        const roommateQuestionMappings = {
            cleanlinessExpectation: { 'very-important': 1, 'important': 0.7, 'somewhat': 0.5, 'not-important': 0 },
            noiseTolerance: { 'very-tolerant': 1, 'tolerant': 0.7, 'moderate': 0.5, 'low-tolerance': 0 },
            foodPreference: { 'similar': 1, 'complementary': 0.7, 'no-preference': 0.5 },
            guestsPolicy: { 'frequent-ok': 1, 'occasional-ok': 0.5, 'prefer-none': 0 },
            choreExpectations: { 'shared-equally': 1, 'flexible': 0.7, 'individual': 0.5 },
            sleepSync: { 'similar-schedule': 1, 'flexible': 0.5, 'no-preference': 0.3 },
            redFlags: { 'none': 1, 'minor-issues': 0.5, 'major-concerns': 0 },
            colivingVibe: { 'friends': 1, 'friendly': 0.7, 'respectful': 0.5, 'minimal': 0 }
        };
        
        // Map each answer to its numerical value for roommate questions
        Object.keys(roommateQuestionMappings).forEach(key => {
            if (answers[key] && roommateQuestionMappings[key][answers[key]] !== undefined) {
                vector.push(roommateQuestionMappings[key][answers[key]]);
            } else {
                vector.push(0.5); // Default neutral value
            }
        });
    }
    
    return validateAndNormalizeVector(vector, 'desiredVector');
}; 