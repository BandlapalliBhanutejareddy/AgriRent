class CommunitySender {
  final String id;
  final String name;
  final String? profileImage;

  const CommunitySender({
    required this.id,
    required this.name,
    this.profileImage,
  });

  factory CommunitySender.fromJson(Map<String, dynamic> json) {
    return CommunitySender(
      id: json['id']?.toString() ?? '',
      name: json['name']?.toString() ?? 'Farmer',
      profileImage: json['profileImage']?.toString(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'profileImage': profileImage,
    };
  }
}

class CommunityMessage {
  final String id;
  final String senderId;
  final String text;
  final DateTime createdAt;
  final CommunitySender? sender;
  final String category;
  final String? imageUrl;
  final String? replyToAuthor;
  final String cleanText;

  const CommunityMessage({
    required this.id,
    required this.senderId,
    required this.text,
    required this.createdAt,
    this.sender,
    this.category = 'Discussions',
    this.imageUrl,
    this.replyToAuthor,
    this.cleanText = '',
  });

  factory CommunityMessage.fromJson(Map<String, dynamic> json) {
    final rawText = json['text']?.toString() ?? '';
    String parsedCategory = 'Discussions';
    String clean = rawText;
    String? replyAuthor;
    String? imgUrl;

    if (rawText.startsWith('[Reply to @') && rawText.contains(']')) {
      final end = rawText.indexOf(']');
      replyAuthor = rawText.substring(11, end).trim();
      clean = rawText.substring(end + 1).trim();
    } else if (rawText.startsWith('[') && rawText.contains(']')) {
      final end = rawText.indexOf(']');
      final tag = rawText.substring(1, end).trim();
      if (tag.isNotEmpty) {
        parsedCategory = tag;
        clean = rawText.substring(end + 1).trim();
      }
    }

    if (parsedCategory == 'Discussions') {
      final lower = rawText.toLowerCase();
      if (lower.contains('tractor') ||
          lower.contains('harvester') ||
          lower.contains('rotavator') ||
          lower.contains('tiller') ||
          lower.contains('sprayer') ||
          lower.contains('equipment') ||
          lower.contains('rent') ||
          lower.contains('hire') ||
          lower.contains('demand') ||
          lower.contains('need machine')) {
        parsedCategory = 'Equipment Demand';
      } else if (lower.contains('crop') ||
          lower.contains('paddy') ||
          lower.contains('cotton') ||
          lower.contains('chilli') ||
          lower.contains('wheat') ||
          lower.contains('sowing') ||
          lower.contains('harvest') ||
          lower.contains('variety') ||
          lower.contains('fertilizer') ||
          lower.contains('soil') ||
          lower.contains('pest')) {
        parsedCategory = 'Crops & Farming';
      } else if (lower.contains('price') ||
          lower.contains('mandi') ||
          lower.contains('market') ||
          lower.contains('weather') ||
          lower.contains('rain') ||
          lower.contains('yield')) {
        parsedCategory = 'Farming Advice';
      }
    }

    final imgRegex = RegExp(r'https?://[^\s]+\.(?:jpg|jpeg|png|webp|gif)', caseSensitive: false);
    final match = imgRegex.firstMatch(rawText);
    if (match != null) {
      imgUrl = match.group(0);
    }

    return CommunityMessage(
      id: json['id']?.toString() ?? '',
      senderId: json['senderId']?.toString() ?? '',
      text: rawText,
      createdAt: json['createdAt'] != null
          ? DateTime.tryParse(json['createdAt'].toString()) ?? DateTime.now()
          : DateTime.now(),
      sender: json['sender'] != null && json['sender'] is Map<String, dynamic>
          ? CommunitySender.fromJson(json['sender'] as Map<String, dynamic>)
          : null,
      category: parsedCategory,
      imageUrl: imgUrl,
      replyToAuthor: replyAuthor,
      cleanText: clean.isNotEmpty ? clean : rawText,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'senderId': senderId,
      'text': text,
      'createdAt': createdAt.toIso8601String(),
      'sender': sender?.toJson(),
    };
  }
}

class CommunityInfo {
  final String id;
  final String name;
  final String description;
  final bool isMember;
  final int memberCount;
  final int messageCount;

  const CommunityInfo({
    required this.id,
    required this.name,
    required this.description,
    required this.isMember,
    required this.memberCount,
    required this.messageCount,
  });

  factory CommunityInfo.fromJson(Map<String, dynamic> json) {
    return CommunityInfo(
      id: json['id']?.toString() ?? 'agrorent-farmer-community',
      name: json['name']?.toString() ?? 'AgroRent Farmer Community',
      description: json['description']?.toString() ?? '',
      isMember: json['isMember'] == true,
      memberCount: int.tryParse(json['memberCount']?.toString() ?? '0') ?? 0,
      messageCount: int.tryParse(json['messageCount']?.toString() ?? '0') ?? 0,
    );
  }
}

class MemberCrop {
  final String? id;
  final String cropName;
  final String? variety;
  final String? season;
  final String? stage;
  final DateTime? sowingDate;
  final DateTime? expectedHarvestDate;

  const MemberCrop({
    this.id,
    required this.cropName,
    this.variety,
    this.season,
    this.stage,
    this.sowingDate,
    this.expectedHarvestDate,
  });

  factory MemberCrop.fromJson(Map<String, dynamic> json) {
    return MemberCrop(
      id: json['id']?.toString(),
      cropName: json['cropName']?.toString() ?? '',
      variety: json['variety']?.toString(),
      season: json['season']?.toString(),
      stage: json['stage']?.toString(),
      sowingDate: json['sowingDate'] != null ? DateTime.tryParse(json['sowingDate'].toString()) : null,
      expectedHarvestDate: json['expectedHarvestDate'] != null ? DateTime.tryParse(json['expectedHarvestDate'].toString()) : null,
    );
  }
}

class CommunityMember {
  final String id;
  final String name;
  final String? profileImage;
  final DateTime? joinedAt;
  final String? location;
  final MemberCrop? currentCrop;
  final MemberCrop? nextCrop;

  const CommunityMember({
    required this.id,
    required this.name,
    this.profileImage,
    this.joinedAt,
    this.location,
    this.currentCrop,
    this.nextCrop,
  });

  factory CommunityMember.fromJson(Map<String, dynamic> json) {
    return CommunityMember(
      id: json['id']?.toString() ?? '',
      name: json['name']?.toString() ?? 'Farmer',
      profileImage: json['profileImage']?.toString(),
      joinedAt: json['joinedAt'] != null ? DateTime.tryParse(json['joinedAt'].toString()) : null,
      location: json['location']?.toString() ?? 'Local Region',
      currentCrop: json['currentCrop'] != null && json['currentCrop'] is Map<String, dynamic>
          ? MemberCrop.fromJson(json['currentCrop'] as Map<String, dynamic>)
          : null,
      nextCrop: json['nextCrop'] != null && json['nextCrop'] is Map<String, dynamic>
          ? MemberCrop.fromJson(json['nextCrop'] as Map<String, dynamic>)
          : null,
    );
  }
}

class FarmerPublicProfile {
  final String id;
  final String name;
  final String? profileImage;
  final DateTime? joinedAt;
  final String? location;
  final MemberCrop? currentCrop;
  final MemberCrop? nextCrop;
  final Map<String, dynamic>? farmSummary;

  const FarmerPublicProfile({
    required this.id,
    required this.name,
    this.profileImage,
    this.joinedAt,
    this.location,
    this.currentCrop,
    this.nextCrop,
    this.farmSummary,
  });

  factory FarmerPublicProfile.fromJson(Map<String, dynamic> json) {
    return FarmerPublicProfile(
      id: json['id']?.toString() ?? '',
      name: json['name']?.toString() ?? 'Farmer',
      profileImage: json['profileImage']?.toString(),
      joinedAt: json['joinedAt'] != null ? DateTime.tryParse(json['joinedAt'].toString()) : null,
      location: json['location']?.toString() ?? 'Local Region',
      currentCrop: json['currentCrop'] != null && json['currentCrop'] is Map<String, dynamic>
          ? MemberCrop.fromJson(json['currentCrop'] as Map<String, dynamic>)
          : null,
      nextCrop: json['nextCrop'] != null && json['nextCrop'] is Map<String, dynamic>
          ? MemberCrop.fromJson(json['nextCrop'] as Map<String, dynamic>)
          : null,
      farmSummary: json['farmSummary'] as Map<String, dynamic>?,
    );
  }
}

class CropTrendItem {
  final String cropName;
  final int activeFarmerCount;
  final int plannedFarmerCount;
  final int activeFieldCount;
  final List<dynamic> topRegions;
  final String marketPriceStatus;
  final String marketPriceMessage;

  const CropTrendItem({
    required this.cropName,
    required this.activeFarmerCount,
    required this.plannedFarmerCount,
    required this.activeFieldCount,
    required this.topRegions,
    required this.marketPriceStatus,
    required this.marketPriceMessage,
  });

  factory CropTrendItem.fromJson(Map<String, dynamic> json) {
    return CropTrendItem(
      cropName: json['cropName']?.toString() ?? '',
      activeFarmerCount: int.tryParse(json['activeFarmerCount']?.toString() ?? '0') ?? 0,
      plannedFarmerCount: int.tryParse(json['plannedFarmerCount']?.toString() ?? '0') ?? 0,
      activeFieldCount: int.tryParse(json['activeFieldCount']?.toString() ?? '0') ?? 0,
      topRegions: json['topRegions'] as List<dynamic>? ?? [],
      marketPriceStatus: json['marketPriceStatus']?.toString() ?? 'UNAVAILABLE',
      marketPriceMessage: json['marketPriceMessage']?.toString() ?? '',
    );
  }
}

class CropTrendsResponse {
  final int totalCropsTracked;
  final int totalActiveCultivations;
  final List<CropTrendItem> cropTrends;
  final String marketPriceDisclaimer;
  final String aiExplanation;
  final String updatedAt;

  const CropTrendsResponse({
    required this.totalCropsTracked,
    required this.totalActiveCultivations,
    required this.cropTrends,
    required this.marketPriceDisclaimer,
    required this.aiExplanation,
    required this.updatedAt,
  });

  factory CropTrendsResponse.fromJson(Map<String, dynamic> json) {
    final list = json['cropTrends'] as List<dynamic>? ?? [];
    return CropTrendsResponse(
      totalCropsTracked: int.tryParse(json['totalCropsTracked']?.toString() ?? '0') ?? 0,
      totalActiveCultivations: int.tryParse(json['totalActiveCultivations']?.toString() ?? '0') ?? 0,
      cropTrends: list.map((item) => CropTrendItem.fromJson(item as Map<String, dynamic>)).toList(),
      marketPriceDisclaimer: json['marketPriceDisclaimer']?.toString() ?? '',
      aiExplanation: json['aiExplanation']?.toString() ?? '',
      updatedAt: json['updatedAt']?.toString() ?? '',
    );
  }
}
