import '../../../core/api/api_client.dart';
import '../../../core/constants/api_constants.dart';
import '../../../core/errors/api_error_handler.dart';
import '../models/community_models.dart';

class CommunityService {
  final ApiClient _apiClient = ApiClient();

  Future<CommunityInfo> fetchCommunityInfo() async {
    try {
      final response = await _apiClient.dio.get(ApiConstants.community);
      final data = response.data?['data'] ?? response.data;
      return CommunityInfo.fromJson(data as Map<String, dynamic>);
    } catch (e) {
      throw Exception(ApiErrorHandler.getMessage(e));
    }
  }

  Future<List<CommunityMessage>> fetchMessages({int limit = 100}) async {
    try {
      final response = await _apiClient.dio.get(
        ApiConstants.communityMessages,
        queryParameters: {'limit': limit},
      );
      final data = response.data;
      final List<dynamic> list = data is List
          ? data
          : (data?['data'] is List ? data['data'] as List : []);
      return list
          .map((json) => CommunityMessage.fromJson(json as Map<String, dynamic>))
          .toList();
    } catch (e) {
      throw Exception(ApiErrorHandler.getMessage(e));
    }
  }

  Future<CommunityMessage> sendMessage(String text) async {
    try {
      final response = await _apiClient.dio.post(
        ApiConstants.communityMessages,
        data: {'text': text.trim()},
      );
      final data = response.data?['data'] ?? response.data;
      return CommunityMessage.fromJson(data as Map<String, dynamic>);
    } catch (e) {
      throw Exception(ApiErrorHandler.getMessage(e));
    }
  }

  Future<List<CommunityMember>> fetchMembers() async {
    try {
      final response = await _apiClient.dio.get(ApiConstants.communityMembers);
      final data = response.data;
      final List<dynamic> list = data is List
          ? data
          : (data?['data'] is List ? data['data'] as List : []);
      return list
          .map((json) => CommunityMember.fromJson(json as Map<String, dynamic>))
          .toList();
    } catch (e) {
      throw Exception(ApiErrorHandler.getMessage(e));
    }
  }

  Future<FarmerPublicProfile> fetchMemberProfile(String memberId) async {
    try {
      final response = await _apiClient.dio.get('${ApiConstants.communityMembers}/$memberId');
      final data = response.data?['data'] ?? response.data;
      return FarmerPublicProfile.fromJson(data as Map<String, dynamic>);
    } catch (e) {
      throw Exception(ApiErrorHandler.getMessage(e));
    }
  }

  Future<Map<String, dynamic>> fetchMyCrops() async {
    try {
      final response = await _apiClient.dio.get(ApiConstants.communityMyCrops);
      return (response.data?['data'] ?? response.data) as Map<String, dynamic>;
    } catch (e) {
      throw Exception(ApiErrorHandler.getMessage(e));
    }
  }

  Future<Map<String, dynamic>> saveMyCrops({
    required Map<String, dynamic> currentCrop,
    Map<String, dynamic>? nextCrop,
  }) async {
    try {
      final payload = <String, dynamic>{'currentCrop': currentCrop};
      if (nextCrop != null) {
        payload['nextCrop'] = nextCrop;
      }
      final response = await _apiClient.dio.post(
        ApiConstants.communityMyCrops,
        data: payload,
      );
      return (response.data?['data'] ?? response.data) as Map<String, dynamic>;
    } catch (e) {
      throw Exception(ApiErrorHandler.getMessage(e));
    }
  }

  Future<CropTrendsResponse> fetchCropTrends() async {
    try {
      final response = await _apiClient.dio.get(ApiConstants.communityCropTrends);
      final data = response.data?['data'] ?? response.data;
      return CropTrendsResponse.fromJson(data as Map<String, dynamic>);
    } catch (e) {
      throw Exception(ApiErrorHandler.getMessage(e));
    }
  }
}
