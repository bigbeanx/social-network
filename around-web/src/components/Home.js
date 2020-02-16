import React from 'react';
import { Tabs, Spin, Row, Col, Radio } from 'antd';
import { Gallery } from './Gallery'
import { CreatePostButton } from './CreatePostButton'
import { AroundMap } from './AroundMap'
import {
    GEOLOCATION_OPTIONS,
    POSITION_KEY,
    TOKEN_KEY,
    API_ROOT,
    AUTH_HEADER,
    POST_TYPE_IMAGE,
    POST_TYPE_VIDEO,
    POST_TYPE_UNKNOWN,
    TOPIC_AROUND,
    TOPIC_FACE
} from '../constants';

const { TabPane } = Tabs;

export class Home extends React.Component {
    state = {
      isLoadingGeolocation: false,
      errorMessage: null,
      isLoadingPosts: false,
      posts: [],
      topic: 'around',
    };

    onTopicChange = e => {
        console.log('radio checked', e.target.value);
        this.setState({
            topic: e.target.value,
        }, this.loadPost);
    };

    getGeoLocation() {
        this.setState({
            isLoadingGeolocation: true,
            errorMessage: null,
        });
        if ('geolocation' in navigator) {
            navigator.geolocation.getCurrentPosition(
                this.onGeoLocationSuccess,
                this.onGeoLocationFailure,
                GEOLOCATION_OPTIONS,
            );
        } else {
            this.setState({
                isLoadingGeolocation: false,
                errorMessage: 'Your browser does not support geolocation.',
            });
        }
    }

    onGeoLocationSuccess = (position) => {
        this.setState({
            isLoadingGeolocation: false,
            errorMessage: null,
        });
        console.log(position);
        const { latitude, longitude } = position.coords;
        localStorage.setItem(POSITION_KEY, JSON.stringify({ latitude, longitude}));
        this.loadPost();
    }

    onGeoLocationFailure = () => {
        this.setState({
            isLoadingGeolocation: false,
            error: 'Failed to load geolocation.',
        })
    }

    loadPost = (
        position = JSON.parse(localStorage.getItem(POSITION_KEY)),
        range = 20,
    ) => {
        if (this.state.topic === TOPIC_AROUND) {
            this.loadNearbyPost(position, range);
        } else if (this.state.topic === TOPIC_FACE) {
            this.loadFacePost();
        }
    }

    loadNearbyPost = (
        position = JSON.parse(localStorage.getItem(POSITION_KEY)),
        range = 20,) => {
        this.setState({
            isLoadingPosts: true,
            errorMessage: null,
        });

        const token = localStorage.getItem(TOKEN_KEY);

        fetch(`${API_ROOT}/search?lat=${position.latitude}&lon=${position.longitude}&range=${range}`, {
            method: 'GET',
            headers: {
                Authorization: `${AUTH_HEADER} ${token}`,
            }
        }).then((response) => {
            if (response.ok) {
                return response.json();
            }
            throw new Error('Failed to load posts.');
        }).then((data) => {
            console.log(data);
            this.setState({
                isLoadingPosts: false,
                posts: data ? data : [],
            });
        }).catch((error) => {
            this.setState({
                isLoadingPosts: false,
                errorMessage: error.message,
            })
        })
    }

    loadFacePost = () => {
        this.setState({
            isLoadingPosts: true,
            errorMessage: null,
        });

        const token = localStorage.getItem(TOKEN_KEY);

        fetch(`${API_ROOT}/cluster?term=face`, {
            method: 'GET',
            headers: {
                Authorization: `${AUTH_HEADER} ${token}`,
            }
        }).then((response) => {
            if (response.ok) {
                return response.json();
            }
            throw new Error('Failed to load posts.');
        }).then((data) => {
            console.log(data);
            this.setState({
                isLoadingPosts: false,
                posts: data ? data : [],
            });
        }).catch((error) => {
            this.setState({
                isLoadingPosts: false,
                errorMessage: error.message,
            })
        })
    }

    getPosts(type) {
        if (this.state.error) {
            return <div>{this.state.error}</div>
        } else if(this.state.isLoadingGeolocation) {
            return <Spin tip="Loading geolocation..."/>
        } else if (this.state.isLoadingPosts) {
            return <Spin tip="Loading posts..." />
        } else if (this.state.posts.length > 0) {
            return type === POST_TYPE_IMAGE ? this.getImagePosts() : this.getVideoPosts();
        } else {
            return 'No nearby posts.';
        }
    }

    getImagePosts() {
        const { posts } = this.state;
        const images = posts
            .filter((post) => post.type === POST_TYPE_IMAGE)
            .map((post) => {
                return {
                    user: post.user,
                    src: post.url,
                    thumbnail: post.url,
                    caption: post.message,
                    thumbnailWidth: 400,
                    thumbnailHeight: 300,
                };
            });
        return <Gallery images={images}/>
    }

    getVideoPosts() {
        const {posts} = this.state;
        return (
            <Row gutter={30}>
                {
                    posts
                        .filter((post) => [POST_TYPE_VIDEO, POST_TYPE_UNKNOWN].includes(post.type))
                        .map((post) => (
                            <Col span={6} key={post.url}>
                                <video src={post.url} controls={true} className="video-block"/>
                                <p>{post.user}: {post.message}</p>
                            </Col>
                        ))
                }
            </Row>
        );
    }

    componentDidMount() {
        this.getGeoLocation();
    }


    render() {
        const operations = <CreatePostButton onSuccess={this.loadPost} />;
        return (
            <div>
                <Radio.Group onChange={this.onTopicChange} value={this.state.topic} className='topic-radio-group'>
                    <Radio value={TOPIC_AROUND}>Posts Around Me</Radio>
                    <Radio value={TOPIC_FACE}>Faces Around The World</Radio>
                </Radio.Group>
                <Tabs tabBarExtraContent={operations} className="main-tabs">
                    <TabPane tab="Image Posts" key="1">
                        {this.getPosts(POST_TYPE_IMAGE)}
                    </TabPane>
                    <TabPane tab="Video Posts" key="2">
                        {this.getPosts(POST_TYPE_VIDEO)}
                    </TabPane>
                    <TabPane tab="Map" key="3">
                        <AroundMap
                            googleMapURL="https://maps.googleapis.com/maps/api/js?key=AIzaSyD3CEh9DXuyjozqptVB5LA-dN7MxWWkr9s&v=3.exp&libraries=geometry,drawing,places"
                            loadingElement={<div style={{ height: `100%` }} />}
                            containerElement={<div style={{ height: `600px` }} />}
                            mapElement={<div style={{ height: `100%` }} />}
                            posts={this.state.posts}
                            onChange={this.loadPost}
                        />
                    </TabPane>
                </Tabs>
            </div>
        );
    }
}